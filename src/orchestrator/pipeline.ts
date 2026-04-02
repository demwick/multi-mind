import type { AgentDefinition, AgentResult, PipelineResult } from '../types/index.js';
import { runAgent } from '../agents/claude-runner.js';
import { validateOutput } from '../agents/validator.js';

export interface PipelineCallbacks {
  onAgentStart?: (agent: AgentDefinition) => void;
  onAgentComplete?: (result: AgentResult) => void;
  onAgentError?: (agent: AgentDefinition, error: Error) => void;
  onVerbose?: (message: string) => void;
  onValidationWarning?: (agent: AgentDefinition, errors: string[]) => void;
}

export async function runPipeline(
  agents: AgentDefinition[],
  brief: string,
  options?: {
    model?: string;
    callbacks?: PipelineCallbacks;
    filterAgents?: string[];
    verbose?: boolean;
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
  const failedAgents: string[] = [];

  for (const phaseNum of phases) {
    const phaseAgents = phaseMap.get(phaseNum)!;

    // Log phase start if verbose
    if (options?.verbose) {
      const agentNames = phaseAgents.map((a) => a.name).join(', ');
      options.callbacks?.onVerbose?.(`Phase ${phaseNum}: ${agentNames} (${phaseAgents.length} agents)`);
    }

    // Run all agents in this phase in parallel, tolerating individual failures
    const phaseSettled = await Promise.allSettled(
      phaseAgents.map(async (agent) => {
        // Gather previousOutputs from input_from agents (skip failed ones)
        const previousOutputs = (agent.input_from ?? [])
          .map((name) => {
            const result = outputMap.get(name);
            if (!result) return null;
            return { agentName: result.agentName, output: result.output };
          })
          .filter((o): o is { agentName: string; output: string } => o !== null);

        // Log agent input dependencies if verbose
        if (options?.verbose && (agent.input_from ?? []).length > 0) {
          const inputFrom = agent.input_from!.join(', ');
          options.callbacks?.onVerbose?.(`Agent ${agent.name} receiving input from: ${inputFrom}`);
        }

        options?.callbacks?.onAgentStart?.(agent);

        const agentStart = Date.now();
        try {
          const result = await runAgent(agent, brief, previousOutputs, {
            model: options?.model,
          });

          // Log agent completion if verbose
          if (options?.verbose) {
            const agentDuration = Date.now() - agentStart;
            const outputLength = result.output.length;
            options.callbacks?.onVerbose?.(`Agent ${agent.name} completed in ${agentDuration}ms, output length: ${outputLength} chars`);
          }

          options?.callbacks?.onAgentComplete?.(result);

          // Validate structured output against output_schema if defined
          const validation = validateOutput(result.structured, agent.output_schema);
          if (!validation.valid) {
            options?.callbacks?.onValidationWarning?.(agent, validation.errors);
          }

          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          options?.callbacks?.onAgentError?.(agent, error);
          throw error;
        }
      }),
    );

    // Store results in outputMap and collect; create error results for rejected agents
    for (let i = 0; i < phaseAgents.length; i++) {
      const agent = phaseAgents[i];
      const settled = phaseSettled[i];

      if (settled.status === 'fulfilled') {
        const result = settled.value;
        outputMap.set(agent.name, result);
        allResults.push(result);
      } else {
        const errorMessage = settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
        const errorResult: AgentResult = {
          agentName: agent.name,
          displayName: agent.display_name,
          output: `ERROR: ${errorMessage}`,
          structured: null,
          durationMs: 0,
          timestamp: new Date().toISOString(),
        };
        outputMap.set(agent.name, errorResult);
        allResults.push(errorResult);
        failedAgents.push(agent.name);
      }
    }
  }

  const totalDurationMs = Date.now() - start;

  // Log pipeline completion if verbose
  if (options?.verbose) {
    const succeeded = allResults.length - failedAgents.length;
    options.callbacks?.onVerbose?.(
      `Pipeline complete: ${totalDurationMs}ms, ${allResults.length} agents, ${succeeded} succeeded, ${failedAgents.length} failed`,
    );
  }

  return {
    success: failedAgents.length === 0,
    brief,
    agents: allResults,
    failedAgents,
    totalDurationMs,
  };
}
