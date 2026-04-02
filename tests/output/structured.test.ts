import { describe, it, expect } from 'vitest';
import { generateDecisionsYaml, generateAgentYaml, generateMeta } from '../../src/output/structured.js';
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

describe('generateDecisionsYaml', () => {
  it('contains data keyed by agentName', () => {
    const yaml = generateDecisionsYaml(mockAgents);
    expect(yaml).toContain('product-manager');
    expect(yaml).toContain('cto');
  });

  it('contains structured data from all agents', () => {
    const yaml = generateDecisionsYaml(mockAgents);
    expect(yaml).toContain('requirements');
    expect(yaml).toContain('auth');
    expect(yaml).toContain('tech_stack');
    expect(yaml).toContain('Next.js');
  });

  it('returns a non-empty string', () => {
    const yaml = generateDecisionsYaml(mockAgents);
    expect(typeof yaml).toBe('string');
    expect(yaml.length).toBeGreaterThan(0);
  });
});

describe('generateAgentYaml', () => {
  it('contains the structured data of the agent', () => {
    const yaml = generateAgentYaml(mockAgents[0]);
    expect(yaml).toContain('requirements');
    expect(yaml).toContain('auth');
  });

  it('generates yaml for second agent', () => {
    const yaml = generateAgentYaml(mockAgents[1]);
    expect(yaml).toContain('tech_stack');
    expect(yaml).toContain('Next.js');
  });
});

describe('generateMeta', () => {
  it('has correct version', () => {
    const meta = generateMeta(mockResult);
    expect(meta.version).toBe('0.1.0');
  });

  it('has created_at as ISO string', () => {
    const meta = generateMeta(mockResult);
    expect(meta.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('has the brief', () => {
    const meta = generateMeta(mockResult);
    expect(meta.brief).toBe('Build a SaaS app');
  });

  it('lists all agent names in agents_used', () => {
    const meta = generateMeta(mockResult);
    expect(meta.agents_used).toEqual(['product-manager', 'cto']);
  });

  it('has correct total duration in dag_execution', () => {
    const meta = generateMeta(mockResult);
    expect(meta.dag_execution.total_duration_ms).toBe(3000);
  });

  it('has per-agent durations in dag_execution.agents', () => {
    const meta = generateMeta(mockResult);
    expect(meta.dag_execution.agents['product-manager']).toEqual({ duration_ms: 1000 });
    expect(meta.dag_execution.agents['cto']).toEqual({ duration_ms: 2000 });
  });
});
