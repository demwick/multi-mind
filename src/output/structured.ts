import { stringify } from 'yaml';
import type { AgentResult, PipelineResult, RunMeta } from '../types/index.js';

export function generateDecisionsYaml(agents: AgentResult[]): string {
  const data: Record<string, unknown> = {};
  for (const agent of agents) {
    data[agent.agentName] = agent.structured;
  }
  return stringify(data);
}

export function generateAgentYaml(agent: AgentResult): string {
  return stringify(agent.structured);
}

export function generateMeta(result: PipelineResult): RunMeta {
  const agentsRecord: Record<string, { duration_ms: number }> = {};
  for (const agent of result.agents) {
    agentsRecord[agent.agentName] = { duration_ms: agent.durationMs };
  }

  return {
    version: '0.1.0',
    created_at: new Date().toISOString(),
    brief: result.brief,
    agents_used: result.agents.map((a) => a.agentName),
    dag_execution: {
      total_duration_ms: result.totalDurationMs,
      agents: agentsRecord,
    },
  };
}
