import { Command } from 'commander';
import { join, dirname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { stringify } from 'yaml';
import { loadAgents } from '../../agents/loader.js';
import type { AgentDefinition } from '../../types/index.js';

function makeAgentTemplate(name: string): AgentDefinition {
  return {
    name,
    display_name: name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    description: `Custom agent: ${name}`,
    phase: 1,
    depends_on: [],
    input_from: [],
    system_prompt: `You are a ${name} agent. Analyze the brief and provide your expert perspective.\n\nOutput your analysis as structured YAML inside a fenced code block:\n\n\`\`\`yaml\nanalysis: <your analysis>\nrecommendations:\n  - <recommendation>\n\`\`\`\n`,
    temperature: 0.7,
    output_schema: {
      analysis: { type: 'string' },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
  };
}

export function makeAgentsCommand(): Command {
  const cmd = new Command('agents');
  cmd.description('Manage agent definitions');

  // agents list
  cmd
    .command('list')
    .description('List all available agents')
    .action(async () => {
      const agentsDir = join(process.cwd(), 'agents');
      const agents = await loadAgents(agentsDir);

      if (agents.length === 0) {
        console.log('No agents found in ./agents/');
        return;
      }

      // Build table data
      const colWidths = { name: 12, display_name: 22, phase: 7, deps: 30 };
      const header = [
        'Name'.padEnd(colWidths.name),
        'Display Name'.padEnd(colWidths.display_name),
        'Phase'.padEnd(colWidths.phase),
        'Dependencies',
      ].join(' | ');
      const separator = '-'.repeat(header.length);

      console.log(separator);
      console.log(header);
      console.log(separator);

      for (const agent of agents) {
        const deps = (agent.depends_on ?? []).join(', ') || '(none)';
        const row = [
          agent.name.padEnd(colWidths.name),
          agent.display_name.padEnd(colWidths.display_name),
          String(agent.phase).padEnd(colWidths.phase),
          deps,
        ].join(' | ');
        console.log(row);
      }
      console.log(separator);
      console.log(`Total: ${agents.length} agents`);
    });

  // agents init <name>
  cmd
    .command('init <name>')
    .description('Create a YAML template for a new custom agent')
    .action((name: string) => {
      const targetPath = join(process.cwd(), 'agents', 'custom', `${name}.yaml`);
      mkdirSync(dirname(targetPath), { recursive: true });

      const template = makeAgentTemplate(name);
      const yamlContent = stringify(template);
      writeFileSync(targetPath, yamlContent, 'utf-8');

      console.log(`Created agent template: ${targetPath}`);
      console.log(`Edit it, then run: multi-mind new "<your brief>"`);
    });

  return cmd;
}
