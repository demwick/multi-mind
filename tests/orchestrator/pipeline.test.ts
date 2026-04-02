import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentDefinition, AgentResult } from '../../src/types/index.js';

vi.mock('../../src/agents/claude-runner.js', () => ({
  runAgent: vi.fn(async (agent: AgentDefinition) => ({
    agentName: agent.name,
    displayName: agent.display_name,
    output: `Mock output from ${agent.name}`,
    structured: { mock: true },
    durationMs: 100,
    timestamp: new Date().toISOString(),
  })),
}));

import { runPipeline } from '../../src/orchestrator/pipeline.js';
import { runAgent } from '../../src/agents/claude-runner.js';

const mockRunAgent = vi.mocked(runAgent);

const pm: AgentDefinition = {
  name: 'pm',
  display_name: 'Product Manager',
  description: 'PM agent',
  phase: 1,
  depends_on: [],
  input_from: [],
  system_prompt: 'You are a PM.',
};

const cto: AgentDefinition = {
  name: 'cto',
  display_name: 'CTO',
  description: 'CTO agent',
  phase: 2,
  depends_on: ['pm'],
  input_from: ['pm'],
  system_prompt: 'You are a CTO.',
};

const arch: AgentDefinition = {
  name: 'arch',
  display_name: 'Architect',
  description: 'Architect agent',
  phase: 3,
  depends_on: ['cto'],
  input_from: ['pm', 'cto'],
  system_prompt: 'You are an Architect.',
};

beforeEach(() => {
  mockRunAgent.mockClear();
  mockRunAgent.mockImplementation(async (agent: AgentDefinition) => ({
    agentName: agent.name,
    displayName: agent.display_name,
    output: `Mock output from ${agent.name}`,
    structured: { mock: true },
    durationMs: 100,
    timestamp: new Date().toISOString(),
  }));
});

describe('runPipeline', () => {
  it('runs all agents in dependency order (pm → cto → arch)', async () => {
    const agents = [pm, cto, arch];
    const result = await runPipeline(agents, 'Test brief');

    expect(result.success).toBe(true);
    expect(result.agents).toHaveLength(3);

    // Verify order by checking the order runAgent was called
    const callOrder = mockRunAgent.mock.calls.map((call) => call[0].name);
    const pmIndex = callOrder.indexOf('pm');
    const ctoIndex = callOrder.indexOf('cto');
    const archIndex = callOrder.indexOf('arch');

    expect(pmIndex).toBeLessThan(ctoIndex);
    expect(ctoIndex).toBeLessThan(archIndex);
  });

  it('passes previous outputs to dependent agents (CTO gets PM output, Architect gets PM+CTO)', async () => {
    const agents = [pm, cto, arch];
    await runPipeline(agents, 'Test brief');

    // CTO call: should receive PM output
    const ctoCall = mockRunAgent.mock.calls.find((call) => call[0].name === 'cto');
    expect(ctoCall).toBeDefined();
    const ctoPreviousOutputs = ctoCall![2];
    expect(ctoPreviousOutputs).toHaveLength(1);
    expect(ctoPreviousOutputs[0].agentName).toBe('pm');
    expect(ctoPreviousOutputs[0].output).toBe('Mock output from pm');

    // Architect call: should receive PM and CTO outputs
    const archCall = mockRunAgent.mock.calls.find((call) => call[0].name === 'arch');
    expect(archCall).toBeDefined();
    const archPreviousOutputs = archCall![2];
    expect(archPreviousOutputs).toHaveLength(2);
    const archInputNames = archPreviousOutputs.map((o: { agentName: string; output: string }) => o.agentName);
    expect(archInputNames).toContain('pm');
    expect(archInputNames).toContain('cto');
  });

  it('includes brief in result', async () => {
    const brief = 'Build a rocket ship';
    const result = await runPipeline([pm], brief);

    expect(result.brief).toBe(brief);
    expect(result.success).toBe(true);
  });

  it('PM agent receives no previous outputs', async () => {
    await runPipeline([pm, cto, arch], 'Test brief');

    const pmCall = mockRunAgent.mock.calls.find((call) => call[0].name === 'pm');
    expect(pmCall).toBeDefined();
    const pmPreviousOutputs = pmCall![2];
    expect(pmPreviousOutputs).toHaveLength(0);
  });

  it('result contains all agent results', async () => {
    const result = await runPipeline([pm, cto, arch], 'Test brief');

    const names = result.agents.map((r: AgentResult) => r.agentName);
    expect(names).toContain('pm');
    expect(names).toContain('cto');
    expect(names).toContain('arch');
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('filters agents when filterAgents option is provided', async () => {
    const result = await runPipeline([pm, cto, arch], 'Test brief', {
      filterAgents: ['pm'],
    });

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].agentName).toBe('pm');
    expect(mockRunAgent).toHaveBeenCalledTimes(1);
  });

  it('invokes callbacks at the right times', async () => {
    const onAgentStart = vi.fn();
    const onAgentComplete = vi.fn();
    const onAgentError = vi.fn();

    await runPipeline([pm], 'Test brief', {
      callbacks: { onAgentStart, onAgentComplete, onAgentError },
    });

    expect(onAgentStart).toHaveBeenCalledOnce();
    expect(onAgentStart).toHaveBeenCalledWith(pm);
    expect(onAgentComplete).toHaveBeenCalledOnce();
    expect(onAgentError).not.toHaveBeenCalled();
  });

  it('passes model option to runAgent', async () => {
    await runPipeline([pm], 'Test brief', { model: 'claude-opus-4' });

    expect(mockRunAgent).toHaveBeenCalledWith(pm, 'Test brief', [], { model: 'claude-opus-4' });
  });

  it('continues when one agent fails, returns partial results', async () => {
    mockRunAgent.mockImplementation(async (agent: AgentDefinition) => {
      if (agent.name === 'cto') {
        throw new Error('CTO timed out');
      }
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: `Mock output from ${agent.name}`,
        structured: { mock: true },
        durationMs: 100,
        timestamp: new Date().toISOString(),
      };
    });

    const result = await runPipeline([pm, cto, arch], 'Test brief');

    // All three agents should still be in result.agents
    expect(result.agents).toHaveLength(3);

    const pmResult = result.agents.find((a) => a.agentName === 'pm');
    const ctoResult = result.agents.find((a) => a.agentName === 'cto');
    const archResult = result.agents.find((a) => a.agentName === 'arch');

    expect(pmResult).toBeDefined();
    expect(ctoResult).toBeDefined();
    expect(archResult).toBeDefined();

    // PM and Arch should have real output
    expect(pmResult!.output).toBe('Mock output from pm');
    expect(archResult!.output).toBe('Mock output from arch');

    // CTO should have an error result
    expect(ctoResult!.output).toContain('HATA:');
    expect(ctoResult!.output).toContain('CTO timed out');
    expect(ctoResult!.structured).toBeNull();
  });

  it('marks pipeline as not successful when agent fails', async () => {
    mockRunAgent.mockImplementation(async (agent: AgentDefinition) => {
      if (agent.name === 'cto') {
        throw new Error('CTO timed out');
      }
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: `Mock output from ${agent.name}`,
        structured: { mock: true },
        durationMs: 100,
        timestamp: new Date().toISOString(),
      };
    });

    const result = await runPipeline([pm, cto, arch], 'Test brief');

    expect(result.success).toBe(false);
  });

  it('includes failedAgents list', async () => {
    mockRunAgent.mockImplementation(async (agent: AgentDefinition) => {
      if (agent.name === 'cto') {
        throw new Error('CTO timed out');
      }
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: `Mock output from ${agent.name}`,
        structured: { mock: true },
        durationMs: 100,
        timestamp: new Date().toISOString(),
      };
    });

    const result = await runPipeline([pm, cto, arch], 'Test brief');

    expect(result.failedAgents).toEqual(['cto']);
  });
});
