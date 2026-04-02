import { Command } from 'commander';
import { join } from 'path';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { runAgent } from '../../agents/claude-runner.js';
import { generateAgentReport } from '../../output/markdown.js';
import { generateAgentYaml } from '../../output/structured.js';
import { loadConfig } from '../../config/loader.js';
import { mergeConfig } from '../../config/merge.js';

interface MetaJson {
  brief?: string;
}

export function makeRerunCommand(): Command {
  const cmd = new Command('rerun');
  cmd
    .description('Re-run a single agent with optional feedback')
    .argument('<agent>', 'Agent name to re-run')
    .requiredOption('-i, --input <path>', 'Path to previous run output directory')
    .option('-f, --feedback <text>', 'Feedback text to include in the re-run')
    .option('-m, --model <model>', 'Claude model to use')
    .action(
      async (
        agentName: string,
        options: { input: string; feedback?: string; model?: string },
      ) => {
        const spinner = ora('Loading agent and previous outputs...').start();

        try {
          const fileConfig = loadConfig();
          const merged = mergeConfig(fileConfig, { model: options.model });
          const retryConfig = merged.retry
            ? { maxRetries: merged.retry.max_retries, baseDelayMs: merged.retry.base_delay_ms }
            : undefined;

          // Load agents to find the target agent
          const agentsDir = join(process.cwd(), 'agents');
          const agents = await loadAgents(agentsDir);
          const targetAgent = agents.find((a) => a.name === agentName);

          if (!targetAgent) {
            spinner.fail(`Agent "${agentName}" not found in ./agents/`);
            process.exit(1);
          }

          // Read previous outputs from the input dir agents/*.md files
          const prevAgentsDir = join(options.input, 'agents');
          let mdFiles: string[] = [];
          try {
            mdFiles = readdirSync(prevAgentsDir).filter((f) => f.endsWith('.md'));
          } catch {
            spinner.fail(`Cannot read agents directory at ${prevAgentsDir}`);
            process.exit(1);
          }

          const previousOutputs: Array<{ agentName: string; output: string }> = [];
          for (const file of mdFiles) {
            const name = file.replace(/\.md$/, '');
            if (name === agentName) continue; // skip self
            const content = readFileSync(join(prevAgentsDir, file), 'utf-8');
            previousOutputs.push({ agentName: name, output: content });
          }

          // Read original brief from meta.json
          let brief = 'No brief available';
          try {
            const metaPath = join(options.input, 'meta.json');
            const metaContent = readFileSync(metaPath, 'utf-8');
            const meta = JSON.parse(metaContent) as MetaJson;
            if (meta.brief) {
              brief = meta.brief;
            }
          } catch {
            // meta.json not found; use fallback brief
          }

          spinner.succeed(`Loaded ${previousOutputs.length} previous outputs for context`);
          spinner.start(`Re-running agent: ${targetAgent.display_name}...`);

          // Inject feedback into system_prompt if provided
          let agentToRun = targetAgent;
          if (options.feedback) {
            agentToRun = {
              ...targetAgent,
              system_prompt: targetAgent.system_prompt + `\n\n## Feedback\n${options.feedback}`,
            };
          }

          const result = await runAgent(agentToRun, brief, previousOutputs, {
            model: merged.model,
            retry: retryConfig,
            profiles: merged.profiles,
          });

          spinner.succeed(`Done: ${result.displayName} (${result.durationMs}ms)`);

          // Write updated output files back to the input directory
          const outAgentsDir = join(options.input, 'agents');
          mkdirSync(outAgentsDir, { recursive: true });

          writeFileSync(join(outAgentsDir, `${result.agentName}.md`), generateAgentReport(result), 'utf-8');
          writeFileSync(join(outAgentsDir, `${result.agentName}.yaml`), generateAgentYaml(result), 'utf-8');

          console.log(`\nUpdated output written to ${outAgentsDir}/`);
          console.log(`\n--- ${result.displayName} output (first 500 chars) ---`);
          console.log(result.output.slice(0, 500));
        } catch (err) {
          spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
      },
    );

  return cmd;
}
