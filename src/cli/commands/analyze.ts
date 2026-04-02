import { Command } from 'commander';
import { join, resolve } from 'path';
import ora from 'ora';
import { loadAgents, validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { parseBrief } from '../../context/brief-parser.js';
import { loadProjectContext, projectContextToBrief } from '../../context/project-loader.js';
import { writeOutput } from '../../output/writer.js';
import { generateSummary } from '../../output/markdown.js';
import { synthesize } from '../../orchestrator/synthesizer.js';
import { loadConfig } from '../../config/loader.js';
import { mergeConfig } from '../../config/merge.js';

export function makeAnalyzeCommand(): Command {
  const cmd = new Command('analyze');
  cmd
    .description('Analyze a project directory with the multi-agent pipeline')
    .argument('<path>', 'Path to the project to analyze')
    .option('-v, --verbose', 'Verbose output', false)
    .option('-o, --output-dir <dir>', 'Output base directory')
    .option('-m, --model <model>', 'Claude model to use')
    .option(
      '-a, --agents <agents>',
      'Comma-separated list of agent names to use',
      (val: string) => val.split(',').map((s) => s.trim()),
    )
    .action(
      async (
        projectPath: string,
        options: { verbose: boolean; outputDir?: string; model?: string; agents?: string[] },
      ) => {
        const spinner = ora('Loading project context...').start();

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

          const absolutePath = resolve(projectPath);
          const ctx = loadProjectContext(absolutePath);

          spinner.succeed(
            `Project loaded: ${ctx.techStack.join(', ')} | ${ctx.fileCount} files`,
          );

          const brief = projectContextToBrief(ctx);

          if (options.verbose) {
            console.log('\n--- Brief ---');
            console.log(brief);
            console.log('--- End Brief ---\n');
          }

          spinner.start('Loading agents...');
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

          spinner.succeed(`Agents loaded (${agents.length})`);

          const result = await runPipeline(agents, brief, {
            model: merged.model,
            filterAgents: merged.agents,
            verbose: options.verbose,
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
              onVerbose: options.verbose ? (msg) => console.log(`  [DEBUG] ${msg}`) : undefined,
            },
          });

          const parsed = parseBrief(brief, outputDir);

          spinner.start('Yönetici özeti sentezleniyor...');
          let executiveSummary: string | undefined;
          try {
            executiveSummary = await synthesize(brief, result.agents, { model: merged.model });
            spinner.succeed('Yönetici özeti hazır');
          } catch {
            spinner.warn('Yönetici özeti oluşturulamadı, devam ediliyor...');
          }

          spinner.start('Writing output...');
          writeOutput(result, parsed.outputDir, executiveSummary);
          spinner.succeed(`Output written to ${parsed.outputDir}`);

          if (options.verbose) {
            console.log('\n' + generateSummary(result));
          } else {
            const totalSec = (result.totalDurationMs / 1000).toFixed(2);
            console.log(
              `\nCompleted in ${totalSec}s. Agents run: ${result.agents.map((a) => a.displayName).join(', ')}`,
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
