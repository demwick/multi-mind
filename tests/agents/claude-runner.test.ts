import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';
import { buildPrompt, parseClaudeOutput, runAgent } from '../../src/agents/claude-runner.js';
import type { AgentDefinition } from '../../src/types/index.js';

vi.mock('child_process', () => ({ spawn: vi.fn() }));

import { spawn } from 'child_process';
const mockSpawn = vi.mocked(spawn);

function makeChild(opts: {
  exitCode?: number;
  error?: Error;
  data?: string;
}): ChildProcess {
  const child = new EventEmitter() as unknown as ChildProcess;
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  (child as unknown as Record<string, unknown>).stdin = { write: vi.fn(), end: vi.fn() };
  (child as unknown as Record<string, unknown>).stdout = stdout;
  (child as unknown as Record<string, unknown>).stderr = stderr;

  if (opts.error) {
    setTimeout(() => child.emit('error', opts.error!), 0);
  } else {
    setTimeout(() => {
      if (opts.data) stdout.emit('data', Buffer.from(opts.data));
      child.emit('close', opts.exitCode ?? 0);
    }, 0);
  }
  return child;
}

describe('buildPrompt', () => {
  it('combines system prompt, previous outputs, and brief', () => {
    const result = buildPrompt({
      systemPrompt: 'You are a helpful agent.',
      brief: 'Analyze this market opportunity.',
      previousOutputs: [
        { agentName: 'researcher', output: 'Market is growing at 15% YoY.' },
      ],
    });

    expect(result).toContain('You are a helpful agent.');
    expect(result).toContain('Analyze this market opportunity.');
    expect(result).toContain('researcher');
    expect(result).toContain('Market is growing at 15% YoY.');
    expect(result).toContain('Previous Agent Outputs');
    expect(result).toContain('Brief');
    expect(result).toContain('yaml');
  });

  it('works without previous outputs and does NOT contain "Onceki Ajan Ciktilari"', () => {
    const result = buildPrompt({
      systemPrompt: 'You are a product manager.',
      brief: 'Define the MVP scope.',
      previousOutputs: [],
    });

    expect(result).toContain('You are a product manager.');
    expect(result).toContain('Define the MVP scope.');
    expect(result).not.toContain('Previous Agent Outputs');
    expect(result).toContain('Brief');
    expect(result).toContain('yaml');
  });

  it('includes feedback section when feedback is provided', () => {
    const result = buildPrompt({
      systemPrompt: 'You are a strategist.',
      brief: 'Outline the go-to-market plan.',
      previousOutputs: [],
      feedback: 'Please be more concise.',
    });

    expect(result).toContain('Feedback');
    expect(result).toContain('Please be more concise.');
  });

  it('does NOT include feedback section when feedback is absent', () => {
    const result = buildPrompt({
      systemPrompt: 'You are a strategist.',
      brief: 'Outline the go-to-market plan.',
      previousOutputs: [],
    });

    expect(result).not.toContain('Feedback');
  });
});

describe('parseClaudeOutput', () => {
  it('extracts structured YAML from a code block and returns full text', () => {
    const raw = `Here is my analysis of the situation.

\`\`\`yaml
recommendation: launch
confidence: 0.85
risks:
  - market saturation
  - regulatory hurdles
\`\`\`

That concludes my output.`;

    const result = parseClaudeOutput(raw);

    expect(result.text).toBe(raw);
    expect(result.structured).not.toBeNull();
    expect(result.structured).toMatchObject({
      recommendation: 'launch',
      confidence: 0.85,
    });
    expect((result.structured as Record<string, unknown>).risks).toEqual([
      'market saturation',
      'regulatory hurdles',
    ]);
  });

  it('returns null structured when no YAML block is found', () => {
    const raw = 'This is a plain text response with no code blocks.';

    const result = parseClaudeOutput(raw);

    expect(result.text).toBe(raw);
    expect(result.structured).toBeNull();
  });

  it('returns null structured for non-yaml code blocks', () => {
    const raw = `Some output.\n\`\`\`json\n{"key": "value"}\n\`\`\`\nEnd.`;

    const result = parseClaudeOutput(raw);

    expect(result.text).toBe(raw);
    expect(result.structured).toBeNull();
  });
});

describe('runAgent retry and profile', () => {
  const agent: AgentDefinition = {
    name: 'test-agent',
    display_name: 'Test Agent',
    description: 'test',
    phase: 1,
    depends_on: [],
    input_from: [],
    system_prompt: 'You are a test agent.',
  };

  beforeEach(() => {
    mockSpawn.mockReset();
  });

  it('does not retry on ENOENT (non-transient error)', async () => {
    mockSpawn.mockReturnValue(makeChild({
      error: Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' }),
    }));

    await expect(
      runAgent(agent, 'brief', [], { retry: { maxRetries: 2, baseDelayMs: 10 } })
    ).rejects.toThrow('ENOENT');

    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('retries on exit code error and eventually throws', async () => {
    mockSpawn.mockImplementation(() => makeChild({ exitCode: 1 }));

    await expect(
      runAgent(agent, 'brief', [], { retry: { maxRetries: 1, baseDelayMs: 10 } })
    ).rejects.toThrow('claude CLI exited with code 1');

    // 1 initial + 1 retry
    expect(mockSpawn).toHaveBeenCalledTimes(2);
  });

  it('does not retry when maxRetries is 0', async () => {
    mockSpawn.mockReturnValue(makeChild({ exitCode: 1 }));

    await expect(
      runAgent(agent, 'brief', [], { retry: { maxRetries: 0, baseDelayMs: 10 } })
    ).rejects.toThrow();

    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('passes CLAUDE_CONFIG_DIR env when profile is provided', async () => {
    mockSpawn.mockReturnValue(makeChild({ data: '```yaml\nresult: ok\n```' }));

    await runAgent(agent, 'brief', [], {
      profiles: [{ name: 'primary', config_dir: '/tmp/claude-primary' }],
      retry: { maxRetries: 0 },
    });

    const spawnOpts = mockSpawn.mock.calls[0][2] as { env?: NodeJS.ProcessEnv };
    expect(spawnOpts?.env?.CLAUDE_CONFIG_DIR).toBe('/tmp/claude-primary');
  });

  it('backward compatible: no profiles → no CLAUDE_CONFIG_DIR override', async () => {
    mockSpawn.mockReturnValue(makeChild({ data: '```yaml\nresult: ok\n```' }));

    await runAgent(agent, 'brief', [], { retry: { maxRetries: 0 } });

    const spawnOpts = mockSpawn.mock.calls[0][2] as { env?: NodeJS.ProcessEnv };
    expect(spawnOpts?.env).toBeUndefined();
  });
});
