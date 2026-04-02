import { Command } from 'commander';
import { join } from 'path';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import { generateSummary } from '../../output/markdown.js';

export function makeDecideCommand(): Command {
  const cmd = new Command('decide');
  cmd
    .description('Have all agents independently evaluate a question in parallel')
    .argument('<question>', 'The question to evaluate')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-o, --output-dir <dir>', 'Output base directory', 'output')
    .option('-m, --model <model>', 'Claude model to use')
    .option(
      '-a, --agents <agents>',
      'Comma-separated list of agent names to use',
      (val: string) => val.split(',').map((s) => s.trim()),
    )
    .action(
      async (
        question: string,
        options: { verbose: boolean; outputDir: string; model?: string; agents?: string[] },
      ) => {
        const spinner = ora('Loading agents...').start();

        try {
          const agentsDir = join(process.cwd(), 'agents');
          const agents = await loadAgents(agentsDir);

          if (agents.length === 0) {
            spinner.fail('No agents found in ./agents/');
            process.exit(1);
          }

          // Override all agents to phase 1, no dependencies (parallel execution)
          // Append question to each agent's system_prompt
          const parallelAgents = agents.map((agent) => ({
            ...agent,
            phase: 1,
            depends_on: [],
            input_from: [],
            system_prompt: agent.system_prompt + `\n\n## Decision Question\nEvaluate and answer the following question independently:\n${question}`,
          }));

          // Validate (trivially valid since no deps, but keep for consistency)
          const validation = validateDag(parallelAgents);
          if (!validation.valid) {
            spinner.fail('DAG validation failed after override — this is unexpected.');
            process.exit(1);
          }

          spinner.succeed(`Agents ready (${parallelAgents.length}), running in parallel...`);

          const result = await runPipeline(parallelAgents, question, {
            model: options.model,
            filterAgents: options.agents,
            callbacks: {
              onAgentStart: (agent) => {
                spinner.start(`Running: ${agent.display_name}`);
              },
              onAgentComplete: (result) => {
                spinner.succeed(`Done: ${result.displayName} (${result.durationMs}ms)`);
              },
              onAgentError: (agent, error) => {
                spinner.fail(`Error in ${agent.display_name}: ${error.message}`);
              },
            },
          });

          const parsed = parseBrief(question, options.outputDir);
          spinner.start('Writing output...');
          writeOutput(result, parsed.outputDir);
          spinner.succeed(`Output written to ${parsed.outputDir}`);

          if (options.verbose) {
            console.log('\n' + generateSummary(result));
          } else {
            const totalSec = (result.totalDurationMs / 1000).toFixed(2);
            console.log(
              `\nCompleted in ${totalSec}s. Agents: ${result.agents.map((a) => a.displayName).join(', ')}`,
            );
          }
        } catch (err) {
          spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
      },
    );

  return cmd;
}
