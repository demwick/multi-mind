import { describe, it, expect } from 'vitest';
import { generateSummary, generateAgentReport } from '../../src/output/markdown.js';
import type { AgentResult, PipelineResult } from '../../src/types/index.js';

const mockAgents: AgentResult[] = [
  {
    agentName: 'product-manager',
    displayName: 'Product Manager',
    output: 'Requirements analysis complete.',
    structured: { requirements: { must_have: ['auth'] } },
    durationMs: 1000,
    timestamp: '2026-04-02T10:00:00Z',
  },
  {
    agentName: 'cto',
    displayName: 'CTO / Tech Lead',
    output: 'Tech stack selected: Next.js.',
    structured: { tech_stack: { frontend: 'Next.js' } },
    durationMs: 2000,
    timestamp: '2026-04-02T10:01:00Z',
  },
];

const mockResult: PipelineResult = {
  success: true,
  brief: 'Build a SaaS app',
  agents: mockAgents,
  totalDurationMs: 3000,
};

describe('generateSummary', () => {
  it('contains the title', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('# multi-mind Analysis Report');
  });

  it('contains the brief', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('Build a SaaS app');
  });

  it('contains all agent display names as headers', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('## Product Manager');
    expect(summary).toContain('## CTO / Tech Lead');
  });

  it('contains all agent outputs', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('Requirements analysis complete.');
    expect(summary).toContain('Tech stack selected: Next.js.');
  });

  it('contains total duration', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('3.00s');
  });

  it('contains separators between sections', () => {
    const summary = generateSummary(mockResult);
    expect(summary).toContain('---');
  });
});

describe('generateAgentReport', () => {
  it('contains agent displayName as title', () => {
    const report = generateAgentReport(mockAgents[0]);
    expect(report).toContain('# Product Manager');
  });

  it('contains agent name metadata', () => {
    const report = generateAgentReport(mockAgents[0]);
    expect(report).toContain('product-manager');
  });

  it('contains duration', () => {
    const report = generateAgentReport(mockAgents[0]);
    expect(report).toContain('1000ms');
  });

  it('contains timestamp', () => {
    const report = generateAgentReport(mockAgents[0]);
    expect(report).toContain('2026-04-02T10:00:00Z');
  });

  it('contains full output text', () => {
    const report = generateAgentReport(mockAgents[0]);
    expect(report).toContain('Requirements analysis complete.');
  });

  it('generates correct report for second agent', () => {
    const report = generateAgentReport(mockAgents[1]);
    expect(report).toContain('# CTO / Tech Lead');
    expect(report).toContain('cto');
    expect(report).toContain('2000ms');
    expect(report).toContain('Tech stack selected: Next.js.');
  });
});
