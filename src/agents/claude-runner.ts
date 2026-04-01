import { execFile } from 'child_process';
import { parse as parseYaml } from 'yaml';
import type { AgentDefinition, AgentResult } from '../types/index.js';

export interface PromptInput {
  systemPrompt: string;
  brief: string;
  previousOutputs: Array<{ agentName: string; output: string }>;
  feedback?: string;
}

export function buildPrompt(input: PromptInput): string {
  const { systemPrompt, brief, previousOutputs, feedback } = input;
  const parts: string[] = [];

  parts.push(systemPrompt);

  if (previousOutputs.length > 0) {
    parts.push('\n## Onceki Ajan Ciktilari');
    for (const { agentName, output } of previousOutputs) {
      parts.push(`\n### ${agentName}\n${output}`);
    }
  }

  parts.push(`\n## Brief\n${brief}`);

  if (feedback) {
    parts.push(`\n## Geri Bildirim\n${feedback}`);
  }

  parts.push(
    '\nLutfen yapilandirilmis ciktini bir YAML kod blogu icinde sagla:\n```yaml\n# ciktini buraya yaz\n```'
  );

  return parts.join('\n');
}

export function parseClaudeOutput(raw: string): {
  text: string;
  structured: Record<string, unknown> | null;
} {
  const yamlBlockRegex = /```yaml\s*\n([\s\S]*?)```/;
  const match = raw.match(yamlBlockRegex);

  if (!match) {
    return { text: raw, structured: null };
  }

  try {
    const parsed = parseYaml(match[1]) as Record<string, unknown>;
    return { text: raw, structured: parsed ?? null };
  } catch {
    return { text: raw, structured: null };
  }
}

export async function runAgent(
  agent: AgentDefinition,
  brief: string,
  previousOutputs: Array<{ agentName: string; output: string }>,
  options?: { model?: string }
): Promise<AgentResult> {
  const start = Date.now();

  const prompt = buildPrompt({
    systemPrompt: agent.system_prompt,
    brief,
    previousOutputs,
  });

  const model = options?.model ?? agent.model;
  const args: string[] = ['-p', prompt, '--output-format', 'text'];
  if (model) {
    args.push('--model', model);
  }

  const raw = await new Promise<string>((resolve, reject) => {
    execFile('claude', args, { timeout: 300_000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`claude CLI error: ${err.message}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });

  const { text, structured } = parseClaudeOutput(raw);
  const durationMs = Date.now() - start;

  return {
    agentName: agent.name,
    displayName: agent.display_name,
    output: text,
    structured,
    durationMs,
    timestamp: new Date().toISOString(),
  };
}
