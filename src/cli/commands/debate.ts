import { Command } from 'commander';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { runAgent } from '../../agents/claude-runner.js';
import { parseBrief } from '../../context/brief-parser.js';
import { loadConfig } from '../../config/loader.js';
import { mergeConfig } from '../../config/merge.js';

export function makeDebateCommand(): Command {
  const cmd = new Command('debate');
  cmd
    .description('Run two agents in opposing positions on a topic')
    .argument('<topic>', 'The topic to debate')
    .option(
      '-a, --agents <agents>',
      'Comma-separated list of exactly 2 agent names',
      (val: string) => val.split(',').map((s) => s.trim()),
      ['cto', 'architect'],
    )
    .option('-o, --output-dir <dir>', 'Output base directory', 'output')
    .option('-m, --model <model>', 'Claude model to use')
    .action(
      async (
        topic: string,
        options: { agents: string[]; outputDir: string; model?: string },
      ) => {
        const spinner = ora('Loading agents...').start();

        try {
          const fileConfig = loadConfig();
          const merged = mergeConfig(fileConfig, { model: options.model });
          const retryConfig = merged.retry
            ? { maxRetries: merged.retry.max_retries, baseDelayMs: merged.retry.base_delay_ms }
            : undefined;

          if (options.agents.length !== 2) {
            spinner.fail('Debate requires exactly 2 agents (use --agents agent1,agent2)');
            process.exit(1);
          }

          const agentsDir = join(process.cwd(), 'agents');
          const allAgents = await loadAgents(agentsDir);

          const [proName, conName] = options.agents;
          const proAgent = allAgents.find((a) => a.name === proName);
          const conAgent = allAgents.find((a) => a.name === conName);

          if (!proAgent) {
            spinner.fail(`Agent "${proName}" not found in ./agents/`);
            process.exit(1);
          }
          if (!conAgent) {
            spinner.fail(`Agent "${conName}" not found in ./agents/`);
            process.exit(1);
          }

          spinner.succeed(`Agents loaded: PRO=${proAgent.display_name}, CON=${conAgent.display_name}`);

          // PRO agent argues in favour
          const proAgentWithPosition = {
            ...proAgent,
            system_prompt: proAgent.system_prompt + `\n\n## Debate Position\nYou are arguing the PRO position. Make the strongest case FOR the following topic.`,
          };

          spinner.start(`PRO position: running ${proAgent.display_name}...`);
          const proResult = await runAgent(proAgentWithPosition, topic, [], {
            model: merged.model,
            retry: retryConfig,
            profiles: merged.profiles,
          });
          spinner.succeed(`PRO done: ${proResult.displayName} (${proResult.durationMs}ms)`);

          // CON agent argues against, receives PRO output
          const conAgentWithPosition = {
            ...conAgent,
            system_prompt: conAgent.system_prompt + `\n\n## Debate Position\nYou are arguing the CON position. Make the strongest case AGAINST the following topic. You have seen the PRO argument above — rebut it directly.`,
          };

          spinner.start(`CON position: running ${conAgent.display_name}...`);
          const conResult = await runAgent(
            conAgentWithPosition,
            topic,
            [{ agentName: proResult.agentName, output: proResult.output }],
            { model: merged.model, retry: retryConfig, profiles: merged.profiles },
          );
          spinner.succeed(`CON done: ${conResult.displayName} (${conResult.durationMs}ms)`);

          // Write debate report
          const parsed = parseBrief(topic, options.outputDir);
          const outputDir = parsed.outputDir + '-debate';
          mkdirSync(outputDir, { recursive: true });

          const debateReport = [
            `# Debate Report`,
            ``,
            `**Topic:** ${topic}`,
            `**Date:** ${parsed.date}`,
            ``,
            `---`,
            ``,
            `## PRO: ${proResult.displayName}`,
            ``,
            proResult.output,
            ``,
            `---`,
            ``,
            `## CON: ${conResult.displayName}`,
            ``,
            conResult.output,
            ``,
            `---`,
            ``,
            `*Total time: PRO ${proResult.durationMs}ms, CON ${conResult.durationMs}ms*`,
          ].join('\n');

          writeFileSync(join(outputDir, 'debate.md'), debateReport, 'utf-8');
          spinner.succeed(`Debate report written to ${outputDir}/debate.md`);

          console.log('\n--- PRO Summary (first 500 chars) ---');
          console.log(proResult.output.slice(0, 500));
          console.log('\n--- CON Summary (first 500 chars) ---');
          console.log(conResult.output.slice(0, 500));
        } catch (err) {
          spinner.fail(`Failed: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
      },
    );

  return cmd;
}
