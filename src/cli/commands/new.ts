import { Command } from 'commander';
import { join } from 'path';
import ora from 'ora';
import { loadAgents, validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import { generateSummary } from '../../output/markdown.js';

export function makeNewCommand(): Command {
  const cmd = new Command('new');
  cmd
    .description('Run the full multi-agent pipeline on a brief')
    .argument('<brief>', 'The brief to process')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-o, --output-dir <dir>', 'Output base directory', 'output')
    .option('-m, --model <model>', 'Claude model to use')
    .option(
      '-a, --agents <agents>',
      'Comma-separated list of agent names to use',
      (val: string) => val.split(',').map((s) => s.trim()),
    )
    .action(async (brief: string, options: { verbose: boolean; outputDir: string; model?: string; agents?: string[] }) => {
      const spinner = ora('Loading agents...').start();
      try {
        const agentsDir = join(process.cwd(), 'agents');
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

        const parsed = parseBrief(brief, options.outputDir);
        spinner.succeed(`Agents loaded (${agents.length}). Output: ${parsed.outputDir}`);

        const result = await runPipeline(agents, brief, {
          model: options.model,
          filterAgents: options.agents,
          callbacks: {
            onAgentStart: (agent) => {
              spinner.start(`Running agent: ${agent.display_name} (phase ${agent.phase})`);
            },
            onAgentComplete: (result) => {
              spinner.succeed(`Done: ${result.displayName} (${result.durationMs}ms)`);
            },
            onAgentError: (agent, error) => {
              spinner.fail(`Error in ${agent.display_name}: ${error.message}`);
            },
          },
        });

        spinner.start('Writing output...');
        writeOutput(result, parsed.outputDir);
        spinner.succeed(`Output written to ${parsed.outputDir}`);

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
