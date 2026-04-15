import { spawn } from 'child_process';
import os from 'os';
import { parse as parseYaml } from 'yaml';
import type { AgentDefinition, AgentResult, RetryConfig, ProfileConfig, ProviderConfig } from '../types/index.js';
import { runWithSDK, getDefaultModel } from './sdk-runner.js';

export interface PromptInput {
  systemPrompt: string;
  brief: string;
  previousOutputs: Array<{ agentName: string; output: string }>;
  feedback?: string;
  includeSystemPrompt?: boolean;
}

export function buildPrompt(input: PromptInput): string {
  const { systemPrompt, brief, previousOutputs, feedback, includeSystemPrompt = true } = input;
  const parts: string[] = [];

  if (includeSystemPrompt) {
    parts.push(systemPrompt);
  }

  if (previousOutputs.length > 0) {
    parts.push('\n## Previous Agent Outputs');
    for (const { agentName, output } of previousOutputs) {
      parts.push(`\n### ${agentName}\n${output}`);
    }
  }

  parts.push(`\n## Brief\n${brief}`);

  if (feedback) {
    parts.push(`\n## Feedback\n${feedback}`);
  }

  parts.push(
    '\nPlease provide your structured output inside a YAML code block:\n```yaml\n# your output here\n```'
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

function isTransientError(err: Error): boolean {
  // ENOENT means claude CLI not found — not retriable
  if (err.message.includes('ENOENT')) return false;
  return true;
}

function isRateLimitError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests');
}

export async function runAgent(
  agent: AgentDefinition,
  brief: string,
  previousOutputs: Array<{ agentName: string; output: string }>,
  options?: {
    model?: string;
    retry?: RetryConfig;
    profiles?: ProfileConfig[];
    providerConfig?: ProviderConfig;
    onVerbose?: (msg: string) => void;
  }
): Promise<AgentResult> {
  const start = Date.now();

  if (options?.providerConfig) {
    const model =
      options.model ?? agent.model ?? getDefaultModel(options.providerConfig.provider);
    const userPrompt = buildPrompt({
      systemPrompt: agent.system_prompt,
      brief,
      previousOutputs,
      includeSystemPrompt: false,
    });
    const raw = await runWithSDK({
      providerConfig: options.providerConfig,
      model,
      systemPrompt: agent.system_prompt,
      prompt: userPrompt,
      temperature: agent.temperature,
      retry: options.retry,
      onVerbose: options.onVerbose,
    });
    const { text, structured } = parseClaudeOutput(raw);
    return {
      agentName: agent.name,
      displayName: agent.display_name,
      output: text,
      structured,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  const maxRetries = options?.retry?.maxRetries ?? 2;
  const baseDelayMs = options?.retry?.baseDelayMs ?? 3000;
  const profiles = options?.profiles ?? [];

  const prompt = buildPrompt({
    systemPrompt: agent.system_prompt,
    brief,
    previousOutputs,
  });

  const model = options?.model ?? agent.model;
  const args: string[] = ['-p', '-', '--output-format', 'text'];
  if (model) {
    args.push('--model', model);
  }

  const TIMEOUT_MS = 600_000; // 10 minutes per agent

  function attemptRun(configDir?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const resolvedConfigDir = configDir
        ? configDir.replace(/^~/, os.homedir())
        : undefined;

      const child = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...(resolvedConfigDir ? { env: { ...process.env, CLAUDE_CONFIG_DIR: resolvedConfigDir } } : {}),
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
        reject(new Error(`Agent timeout (${TIMEOUT_MS / 1000}s)`));
      }, TIMEOUT_MS);

      child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killed) return;
        if (code !== 0) {
          reject(new Error(`claude CLI exited with code ${code}: ${stderr.slice(0, 500)}`));
          return;
        }
        resolve(stdout);
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`claude CLI error: ${err.message}`));
      });

      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  let profileIndex = 0;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const configDir = profiles.length > 0 ? profiles[profileIndex % profiles.length].config_dir : undefined;
    try {
      const raw = await attemptRun(configDir);
      const { text, structured } = parseClaudeOutput(raw);
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: text,
        structured,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Non-transient (e.g. ENOENT) → give up immediately
      if (!isTransientError(lastError)) throw lastError;

      // Last attempt → give up
      if (attempt >= maxRetries) throw lastError;

      // Rate limit → rotate to next profile
      if (isRateLimitError(lastError) && profiles.length > 1) {
        profileIndex++;
        options?.onVerbose?.(
          `Rate limit on profile "${profiles[(profileIndex - 1) % profiles.length].name}", switching to "${profiles[profileIndex % profiles.length].name}"`
        );
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      options?.onVerbose?.(
        `Agent ${agent.name} attempt ${attempt + 1} failed (${lastError.message.slice(0, 80)}), retrying in ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}
