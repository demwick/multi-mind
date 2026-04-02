import { Command } from 'commander';
import { createInterface } from 'readline';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// In dist: __dirname = dist/cli/commands/
// Agent YAMLs are at: ../../agents/ (relative to package root)
const packageRoot = join(__dirname, '..', '..', '..');
const defaultAgentsDir = join(packageRoot, 'agents');

const MULTIMINDRC_CONTENT = `# multi-mind configuration
# See: https://github.com/demirel/multi-mind

# model: claude-sonnet-4-6
# output_dir: output
# agents_dir: ./agents
# language: tr
# agents:
#   - product-manager
#   - cto
#   - architect
#   - devops-engineer
#   - qa-engineer
#   - security-analyst
`;

const DEFAULT_AGENT_FILES = [
  'product-manager.yaml',
  'cto.yaml',
  'architect.yaml',
  'devops-engineer.yaml',
  'qa-engineer.yaml',
  'security-analyst.yaml',
];

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export function makeInitCommand(): Command {
  const cmd = new Command('init');
  cmd
    .description('Initialize a new project for multi-mind usage')
    .action(async () => {
      const cwd = process.cwd();
      const agentsDir = join(cwd, 'agents');
      const customDir = join(agentsDir, 'custom');
      const rcFile = join(cwd, '.multimindrc.yaml');
      const gitignoreFile = join(cwd, '.gitignore');

      // Check if agents/ already exists
      if (existsSync(agentsDir)) {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.on('SIGINT', () => {
          console.log('\nCancelled.');
          rl.close();
          process.exit(0);
        });
        const answer = await ask(rl, 'Agents directory already exists. Overwrite? (y/N) ');
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          process.exit(0);
        }
      }

      // Copy default agent YAML files to ./agents/
      mkdirSync(agentsDir, { recursive: true });
      let copiedCount = 0;
      for (const file of DEFAULT_AGENT_FILES) {
        const src = join(defaultAgentsDir, file);
        const dest = join(agentsDir, file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
          copiedCount++;
        }
      }

      // Create agents/custom/ directory
      mkdirSync(customDir, { recursive: true });

      // Create .multimindrc.yaml with commented-out defaults
      writeFileSync(rcFile, MULTIMINDRC_CONTENT, 'utf8');

      // Add output/ to .gitignore if it exists and doesn't already have it
      if (existsSync(gitignoreFile)) {
        const gitignoreContent = readFileSync(gitignoreFile, 'utf8');
        if (!gitignoreContent.split('\n').some((line) => line.trim() === 'output/')) {
          const separator = gitignoreContent.endsWith('\n') ? '' : '\n';
          writeFileSync(gitignoreFile, gitignoreContent + separator + 'output/\n', 'utf8');
        }
      }

      // Print success message
      console.log(`
✅ multi-mind initialized!

Created:
  agents/                  ${copiedCount} default agents
  agents/custom/           Custom agents directory
  .multimindrc.yaml        Configuration file

Next steps:
  multi-mind new "Your project brief here"
  multi-mind agents list
`);
    });

  return cmd;
}
