import type { AgentDefinition, AgentResult, PipelineResult } from '../types/index.js';
import { runAgent } from '../agents/claude-runner.js';

export interface PipelineCallbacks {
  onAgentStart?: (agent: AgentDefinition) => void;
  onAgentComplete?: (result: AgentResult) => void;
  onAgentError?: (agent: AgentDefinition, error: Error) => void;
}

export async function runPipeline(
  agents: AgentDefinition[],
  brief: string,
  options?: {
    model?: string;
    callbacks?: PipelineCallbacks;
    filterAgents?: string[];
  },
): Promise<PipelineResult> {
  const start = Date.now();

  // Apply filterAgents if specified
  let activeAgents = agents;
  if (options?.filterAgents && options.filterAgents.length > 0) {
    activeAgents = agents.filter((a) => options.filterAgents!.includes(a.name));
  }

  // Ensure sorted by phase
  const sorted = [...activeAgents].sort((a, b) => a.phase - b.phase);

  // Group agents by phase number
  const phaseMap = new Map<number, AgentDefinition[]>();
  for (const agent of sorted) {
    const group = phaseMap.get(agent.phase) ?? [];
    group.push(agent);
    phaseMap.set(agent.phase, group);
  }

  const phases = Array.from(phaseMap.keys()).sort((a, b) => a - b);

  // outputMap stores results keyed by agent name
  const outputMap = new Map<string, AgentResult>();
  const allResults: AgentResult[] = [];

  for (const phaseNum of phases) {
    const phaseAgents = phaseMap.get(phaseNum)!;

    // Run all agents in this phase in parallel
    const phaseResults = await Promise.all(
      phaseAgents.map(async (agent) => {
        // Gather previousOutputs from input_from agents
        const previousOutputs = (agent.input_from ?? [])
          .map((name) => {
            const result = outputMap.get(name);
            if (!result) return null;
            return { agentName: result.agentName, output: result.output };
          })
          .filter((o): o is { agentName: string; output: string } => o !== null);

        options?.callbacks?.onAgentStart?.(agent);

        try {
          const result = await runAgent(agent, brief, previousOutputs, {
            model: options?.model,
          });
          options?.callbacks?.onAgentComplete?.(result);
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          options?.callbacks?.onAgentError?.(agent, error);
          throw error;
        }
      }),
    );

    // Store results in outputMap and collect
    for (let i = 0; i < phaseAgents.length; i++) {
      const agent = phaseAgents[i];
      const result = phaseResults[i];
      outputMap.set(agent.name, result);
      allResults.push(result);
    }
  }

  const totalDurationMs = Date.now() - start;

  return {
    success: true,
    brief,
    agents: allResults,
    totalDurationMs,
  };
}
