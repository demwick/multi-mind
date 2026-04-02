import { Command } from 'commander';
import { join, resolve } from 'path';
import ora from 'ora';
import type { AgentDefinition, AgentResult } from '../../types/index.js';
import { loadAgents, validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { runMultiRound } from '../../orchestrator/multi-round.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import { generateSummary } from '../../output/markdown.js';
import { synthesize } from '../../orchestrator/synthesizer.js';
import { loadConfig } from '../../config/loader.js';
import { mergeConfig } from '../../config/merge.js';
import { collectBrief } from '../interactive.js';
import { MultiProgress } from '../progress.js';

export function makeNewCommand(): Command {
  const cmd = new Command('new');
  cmd
    .description('Run the full multi-agent pipeline on a brief')
    .argument('[brief]', 'The brief to process (interactive if omitted)')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-o, --output-dir <dir>', 'Output base directory')
    .option('-m, --model <model>', 'Claude model to use')
    .option(
      '-a, --agents <agents>',
      'Comma-separated list of agent names to use',
      (val: string) => val.split(',').map((s) => s.trim()),
    )
    .option('-r, --rounds <number>', 'Number of analysis rounds (agents review each other)', '1')
    .action(async (brief: string | undefined, options: { verbose: boolean; outputDir?: string; model?: string; agents?: string[]; rounds: string }) => {
      if (!brief) {
        brief = await collectBrief();
      }
      const spinner = ora('Loading agents...').start();
      try {
        const fileConfig = loadConfig();
        const merged = mergeConfig(fileConfig, {
          model: options.model,
          output_dir: options.outputDir,
          agents: options.agents,
        });

        const outputDir = merged.output_dir ?? 'output';
        const agentsDir = merged.agents_dir
          ? resolve(process.cwd(), merged.agents_dir)
          : join(process.cwd(), 'agents');

        const agents = await loadAgents(agentsDir);

        if (agents.length === 0) {
          spinner.fail('No agents found in ./agents/');
          process.exit(1);
        }

        const validation = validateDag(agents);
        if (!validation.valid) {
          spinner.fail('DAG validation failed:');
          for (const err of validation.errors) {
            console.error(`  - ${err}`);
          }
          process.exit(1);
        }

        const parsed = parseBrief(brief, outputDir);
        spinner.succeed(`Agents loaded (${agents.length}). Output: ${parsed.outputDir}`);

        const numRounds = parseInt(options.rounds, 10);

        // Track active agents to support multi-line progress display
        const activeAgents = new Set<string>();
        const multiProgress = new MultiProgress();

        const sharedCallbacks = {
          onAgentStart: (agent: AgentDefinition) => {
            activeAgents.add(agent.name);
            if (activeAgents.size > 1) {
              // Multiple agents running - use multi-line progress
              multiProgress.start(agent.name, `${agent.display_name} running...`);
            } else {
              // Single agent - use ora spinner
              spinner.start(`Running agent: ${agent.display_name} (phase ${agent.phase})`);
            }
          },
          onAgentComplete: (r: AgentResult) => {
            activeAgents.delete(r.agentName);
            const durationSec = (r.durationMs / 1000).toFixed(1);
            if (activeAgents.size >= 1) {
              // Still other agents running - show in multi-progress
              multiProgress.succeed(r.agentName, `${r.displayName} completed (${durationSec}s)`);
            } else {
              // Last agent done - use ora spinner
              spinner.succeed(`Done: ${r.displayName} (${r.durationMs}ms)`);
              multiProgress.stop();
            }
          },
          onAgentError: (agent: AgentDefinition, error: Error) => {
            activeAgents.delete(agent.name);
            if (activeAgents.size >= 1) {
              // Still other agents running - show in multi-progress
              multiProgress.fail(agent.name, `${agent.display_name} error: ${error.message}`);
            } else {
              // Last agent failed - use ora spinner
              spinner.fail(`Error in ${agent.display_name}: ${error.message}`);
              multiProgress.stop();
            }
          },
          onVerbose: options.verbose ? (msg: string) => console.log(`  [DEBUG] ${msg}`) : undefined,
          onValidationWarning: (agent: AgentDefinition, errors: string[]) => {
            console.warn(`  ⚠️  ${agent.display_name} schema warning:`);
            errors.forEach(e => console.warn(`    - ${e}`));
          },
        };

        const retryConfig = merged.retry
          ? { maxRetries: merged.retry.max_retries, baseDelayMs: merged.retry.base_delay_ms }
          : undefined;

        let result;
        if (numRounds > 1) {
          result = await runMultiRound(agents, brief, {
            rounds: numRounds,
            model: merged.model,
            filterAgents: merged.agents,
            verbose: options.verbose,
            retry: retryConfig,
            profiles: merged.profiles,
            callbacks: {
              ...sharedCallbacks,
              onRoundStart: (round, total) => {
                spinner.start(`Starting round ${round}/${total}...`);
              },
              onRoundComplete: (round, roundResults) => {
                spinner.succeed(`Round ${round} complete (${roundResults.length} agents)`);
              },
            },
          });
        } else {
          result = await runPipeline(agents, brief, {
            model: merged.model,
            filterAgents: merged.agents,
            verbose: options.verbose,
            retry: retryConfig,
            profiles: merged.profiles,
            callbacks: sharedCallbacks,
          });
        }

        spinner.start('Synthesizing executive summary...');
        let executiveSummary: string | undefined;
        try {
          executiveSummary = await synthesize(brief, result.agents, { model: merged.model });
          spinner.succeed('Executive summary ready');
        } catch {
          spinner.warn('Could not generate executive summary, continuing...');
        }

        spinner.start('Writing output...');
        writeOutput(result, parsed.outputDir, executiveSummary);
        spinner.succeed(`Output written to ${parsed.outputDir}`);

        if (result.failedAgents.length > 0) {
          console.warn(`\n⚠️  Some agents failed: ${result.failedAgents.join(', ')}`);
          console.warn(`    Report generated with partial results.`);
        }

        if (options.verbose) {
          console.log('\n' + generateSummary(result));
        } else {
          const totalSec = (result.totalDurationMs / 1000).toFixed(2);
          console.log(`\nCompleted in ${totalSec}s. Agents run: ${result.agents.map((a) => a.displayName).join(', ')}`);
        }
      } catch (err) {
        spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  return cmd;
}
