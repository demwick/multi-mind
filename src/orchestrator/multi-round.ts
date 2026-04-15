import type { AgentDefinition, AgentResult, PipelineResult, RetryConfig, ProfileConfig, ProviderConfig } from '../types/index.js';
import { runAgent } from '../agents/claude-runner.js';
import { runPipeline } from './pipeline.js';
import type { PipelineCallbacks } from './pipeline.js';

export interface MultiRoundOptions {
  rounds: number;
  model?: string;
  callbacks?: PipelineCallbacks & {
    onRoundStart?: (round: number, totalRounds: number) => void;
    onRoundComplete?: (round: number, results: AgentResult[]) => void;
  };
  filterAgents?: string[];
  verbose?: boolean;
  retry?: RetryConfig;
  profiles?: ProfileConfig[];
  providerConfig?: ProviderConfig;
}

function buildReviewInstruction(roundNumber: number, previousRoundResults: AgentResult[]): string {
  const allOutputs = previousRoundResults
    .map((r) => `### ${r.displayName} (${r.agentName})\n${r.output}`)
    .join('\n\n');

  return `
---

## Round ${roundNumber} — Cross-Disciplinary Review

This is round ${roundNumber} of the analysis. Below are ALL agents' outputs from the previous round.

${allOutputs}

Your tasks:
1. Review other agents' analyses carefully
2. CHALLENGE any assumptions or recommendations you disagree with, explaining your reasoning
3. REVISE your own analysis based on cross-functional insights
4. Add these sections:
   - "Consensus Points": Areas where you agree with all agents
   - "My Objections": Points you disagree with and why
   - "Revised Recommendations": Your updated recommendations

**LANGUAGE RULE:** Respond in the same language as the original analyses.`;
}

export async function runMultiRound(
  agents: AgentDefinition[],
  brief: string,
  options: MultiRoundOptions,
): Promise<PipelineResult> {
  const totalStart = Date.now();
  const { rounds, model, callbacks, filterAgents, verbose, retry, profiles, providerConfig } = options;

  const allRounds: AgentResult[][] = [];

  // Apply filterAgents if specified
  let activeAgents = agents;
  if (filterAgents && filterAgents.length > 0) {
    activeAgents = agents.filter((a) => filterAgents.includes(a.name));
  }

  // Sort agents by phase for round 2+ execution
  const sorted = [...activeAgents].sort((a, b) => a.phase - b.phase);

  // Build phase map for round 2+ execution
  const phaseMap = new Map<number, AgentDefinition[]>();
  for (const agent of sorted) {
    const group = phaseMap.get(agent.phase) ?? [];
    group.push(agent);
    phaseMap.set(agent.phase, group);
  }
  const phases = Array.from(phaseMap.keys()).sort((a, b) => a - b);

  // --- Round 1: normal pipeline ---
  callbacks?.onRoundStart?.(1, rounds);

  if (verbose) {
    callbacks?.onVerbose?.(`Starting round 1 of ${rounds}`);
  }

  const round1Result = await runPipeline(activeAgents, brief, {
    model,
    filterAgents: undefined, // already filtered above
    verbose,
    retry,
    profiles,
    providerConfig,
    callbacks: {
      onAgentStart: callbacks?.onAgentStart,
      onAgentComplete: callbacks?.onAgentComplete,
      onAgentError: callbacks?.onAgentError,
      onVerbose: callbacks?.onVerbose,
    },
  });

  allRounds.push(round1Result.agents);
  callbacks?.onRoundComplete?.(1, round1Result.agents);

  if (rounds <= 1) {
    return {
      ...round1Result,
      rounds: allRounds,
    };
  }

  // --- Rounds 2+: review and refine ---
  let previousRoundResults = round1Result.agents;
  let lastRoundAgents: AgentResult[] = round1Result.agents;
  const failedAgents: string[] = [];

  for (let roundNum = 2; roundNum <= rounds; roundNum++) {
    callbacks?.onRoundStart?.(roundNum, rounds);

    if (verbose) {
      callbacks?.onVerbose?.(`Starting round ${roundNum} of ${rounds}`);
    }

    const roundResults: AgentResult[] = [];
    const roundOutputMap = new Map<string, AgentResult>();

    // Clear failed agents list for this round
    failedAgents.length = 0;

    for (const phaseNum of phases) {
      const phaseAgents = phaseMap.get(phaseNum)!;

      if (verbose) {
        const agentNames = phaseAgents.map((a) => a.name).join(', ');
        callbacks?.onVerbose?.(`Round ${roundNum} Phase ${phaseNum}: ${agentNames}`);
      }

      const phaseSettled = await Promise.allSettled(
        phaseAgents.map(async (agent) => {
          // Build modified agent with review instruction appended to system_prompt
          const reviewInstruction = buildReviewInstruction(roundNum, previousRoundResults);
          const modifiedAgent: AgentDefinition = {
            ...agent,
            system_prompt: agent.system_prompt + reviewInstruction,
          };

          // For round 2+, pass ALL previous round results as context (not just input_from)
          const previousOutputs = previousRoundResults.map((r) => ({
            agentName: r.agentName,
            output: r.output,
          }));

          if (verbose) {
            callbacks?.onVerbose?.(
              `Round ${roundNum} Agent ${agent.name} receiving ${previousOutputs.length} previous outputs`,
            );
          }

          callbacks?.onAgentStart?.(agent);

          try {
            const result = await runAgent(modifiedAgent, brief, previousOutputs, {
              model,
              retry,
              profiles,
              providerConfig,
              onVerbose: callbacks?.onVerbose,
            });
            callbacks?.onAgentComplete?.(result);
            return result;
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            callbacks?.onAgentError?.(agent, error);
            throw error;
          }
        }),
      );

      for (let i = 0; i < phaseAgents.length; i++) {
        const agent = phaseAgents[i];
        const settled = phaseSettled[i];

        if (settled.status === 'fulfilled') {
          const result = settled.value;
          roundOutputMap.set(agent.name, result);
          roundResults.push(result);
        } else {
          const errorMessage =
            settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
          const errorResult: AgentResult = {
            agentName: agent.name,
            displayName: agent.display_name,
            output: `ERROR: ${errorMessage}`,
            structured: null,
            durationMs: 0,
            timestamp: new Date().toISOString(),
          };
          roundOutputMap.set(agent.name, errorResult);
          roundResults.push(errorResult);
          failedAgents.push(agent.name);
        }
      }
    }

    allRounds.push(roundResults);
    previousRoundResults = roundResults;
    lastRoundAgents = roundResults;

    callbacks?.onRoundComplete?.(roundNum, roundResults);
  }

  const totalDurationMs = Date.now() - totalStart;

  if (verbose) {
    callbacks?.onVerbose?.(
      `Multi-round complete: ${totalDurationMs}ms, ${rounds} rounds, ${lastRoundAgents.length} agents`,
    );
  }

  return {
    success: failedAgents.length === 0,
    brief,
    agents: lastRoundAgents,
    failedAgents,
    totalDurationMs,
    rounds: allRounds,
  };
}
