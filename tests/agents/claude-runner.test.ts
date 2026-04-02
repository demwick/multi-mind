import { describe, it, expect } from 'vitest';
import { buildPrompt, parseClaudeOutput } from '../../src/agents/claude-runner.js';

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
