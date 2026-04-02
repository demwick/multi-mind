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

import { runMultiRound } from '../../src/orchestrator/multi-round.js';
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

describe('runMultiRound', () => {
  it('round 1 runs normal pipeline in phase order (pm → cto → arch)', async () => {
    const agents = [pm, cto, arch];
    await runMultiRound(agents, 'Test brief', { rounds: 1 });

    const callOrder = mockRunAgent.mock.calls.map((call) => call[0].name);
    const pmIndex = callOrder.indexOf('pm');
    const ctoIndex = callOrder.indexOf('cto');
    const archIndex = callOrder.indexOf('arch');

    expect(pmIndex).toBeLessThan(ctoIndex);
    expect(ctoIndex).toBeLessThan(archIndex);
  });

  it('with rounds=1, result does not include multi-round cross-agent context', async () => {
    const agents = [pm, cto, arch];
    const result = await runMultiRound(agents, 'Test brief', { rounds: 1 });

    expect(result.success).toBe(true);
    expect(result.agents).toHaveLength(3);
    expect(result.rounds).toHaveLength(1);
  });

  it('result contains rounds array with one entry per round', async () => {
    const agents = [pm, cto];
    const result = await runMultiRound(agents, 'Test brief', { rounds: 3 });

    expect(result.rounds).toBeDefined();
    expect(result.rounds).toHaveLength(3);
  });

  it('final agents are from the last round', async () => {
    const agents = [pm];
    let callCount = 0;
    mockRunAgent.mockImplementation(async (agent: AgentDefinition) => {
      callCount++;
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: `Output call #${callCount} from ${agent.name}`,
        structured: { call: callCount },
        durationMs: 100,
        timestamp: new Date().toISOString(),
      };
    });

    const result = await runMultiRound(agents, 'Test brief', { rounds: 3 });

    // Should have been called 3 times (once per round)
    expect(mockRunAgent).toHaveBeenCalledTimes(3);
    // Final agents should be from round 3 (call #3)
    expect(result.agents[0].output).toBe('Output call #3 from pm');
    // Last round in rounds array should also match
    const lastRound = result.rounds![result.rounds!.length - 1];
    expect(lastRound[0].output).toBe('Output call #3 from pm');
  });

  it('round 2+ agents receive ALL previous round outputs (not just input_from)', async () => {
    const agents = [pm, cto, arch];
    await runMultiRound(agents, 'Test brief', { rounds: 2 });

    // Round 1: 3 calls (pm, cto, arch)
    // Round 2: 3 calls (pm, cto, arch) — each gets all 3 previous outputs
    expect(mockRunAgent).toHaveBeenCalledTimes(6);

    // The 4th, 5th, 6th calls are round 2
    const round2Calls = mockRunAgent.mock.calls.slice(3);

    for (const call of round2Calls) {
      const previousOutputs = call[2] as Array<{ agentName: string; output: string }>;
      // Each round 2 agent should receive all 3 previous outputs (pm, cto, arch)
      expect(previousOutputs).toHaveLength(3);
      const names = previousOutputs.map((o) => o.agentName);
      expect(names).toContain('pm');
      expect(names).toContain('cto');
      expect(names).toContain('arch');
    }
  });

  it('round 2+ system_prompt includes review instruction', async () => {
    const agents = [pm];
    await runMultiRound(agents, 'Test brief', { rounds: 2 });

    // Round 2 call (index 1)
    const round2AgentDef = mockRunAgent.mock.calls[1][0];
    expect(round2AgentDef.system_prompt).toContain('Tur 2 - Cok Disiplinli Inceleme');
    expect(round2AgentDef.system_prompt).toContain('Uzlasma Noktalari');
    expect(round2AgentDef.system_prompt).toContain('Itirazlarim');
    expect(round2AgentDef.system_prompt).toContain('Revize Edilen Onerilerim');
    // Original system_prompt should still be there
    expect(round2AgentDef.system_prompt).toContain('You are a PM.');
  });

  it('invokes round callbacks at the right times', async () => {
    const onRoundStart = vi.fn();
    const onRoundComplete = vi.fn();

    const agents = [pm, cto];
    await runMultiRound(agents, 'Test brief', {
      rounds: 2,
      callbacks: { onRoundStart, onRoundComplete },
    });

    expect(onRoundStart).toHaveBeenCalledTimes(2);
    expect(onRoundStart).toHaveBeenNthCalledWith(1, 1, 2);
    expect(onRoundStart).toHaveBeenNthCalledWith(2, 2, 2);

    expect(onRoundComplete).toHaveBeenCalledTimes(2);
    expect(onRoundComplete).toHaveBeenNthCalledWith(1, 1, expect.arrayContaining([expect.objectContaining({ agentName: 'pm' })]));
    expect(onRoundComplete).toHaveBeenNthCalledWith(2, 2, expect.arrayContaining([expect.objectContaining({ agentName: 'pm' })]));
  });

  it('filterAgents limits which agents run', async () => {
    const agents = [pm, cto, arch];
    const result = await runMultiRound(agents, 'Test brief', {
      rounds: 2,
      filterAgents: ['pm', 'cto'],
    });

    // Only pm and cto in each round (2 rounds × 2 agents = 4 calls)
    expect(mockRunAgent).toHaveBeenCalledTimes(4);
    expect(result.agents).toHaveLength(2);
    const names = result.agents.map((r: AgentResult) => r.agentName);
    expect(names).toContain('pm');
    expect(names).toContain('cto');
    expect(names).not.toContain('arch');
  });

  it('rounds array stores results from each round separately', async () => {
    const agents = [pm];
    let callCount = 0;
    mockRunAgent.mockImplementation(async (agent: AgentDefinition) => {
      callCount++;
      return {
        agentName: agent.name,
        displayName: agent.display_name,
        output: `Round output #${callCount}`,
        structured: null,
        durationMs: 100,
        timestamp: new Date().toISOString(),
      };
    });

    const result = await runMultiRound(agents, 'Test brief', { rounds: 3 });

    expect(result.rounds).toHaveLength(3);
    expect(result.rounds![0][0].output).toBe('Round output #1');
    expect(result.rounds![1][0].output).toBe('Round output #2');
    expect(result.rounds![2][0].output).toBe('Round output #3');
  });
});
