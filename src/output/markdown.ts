import type { AgentResult, PipelineResult } from '../types/index.js';

export function generateSummary(result: PipelineResult, executiveSummary?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const durationSec = (result.totalDurationMs / 1000).toFixed(2);
  const numRounds = result.rounds ? result.rounds.length : 1;
  const isMultiRound = numRounds > 1;

  const sections = result.agents.map((agent) => {
    const isFailed = agent.structured === null && agent.output.startsWith('ERROR:');
    if (isFailed) {
      const errorDetail = agent.output.replace(/^ERROR:\s*/, '');
      return `## ${agent.displayName} ⚠️ ERROR\n\n> Error occurred while running this agent: ${errorDetail}`;
    }
    const heading = isMultiRound
      ? `## ${agent.displayName} (Revised)`
      : `## ${agent.displayName}`;
    return `${heading}\n\n${agent.output}`;
  });

  const parts = [
    `# multi-mind Analysis Report`,
    ``,
    `**Date:** ${date}`,
    `**Brief:** ${result.brief}`,
    `**Total Duration:** ${durationSec}s`,
  ];

  if (isMultiRound) {
    parts.push(`**Analysis Rounds:** ${numRounds}`);
  }

  parts.push(``, `---`, ``);

  if (executiveSummary) {
    parts.push(`## Executive Summary`, ``, executiveSummary, ``, `---`, ``);
  }

  parts.push(sections.join('\n\n---\n\n'));

  return parts.join('\n');
}

export function generateAgentReport(agent: AgentResult): string {
  return [
    `# ${agent.displayName}`,
    ``,
    `**Agent:** ${agent.agentName}`,
    `**Duration:** ${agent.durationMs}ms`,
    `**Time:** ${agent.timestamp}`,
    ``,
    `---`,
    ``,
    agent.output,
  ].join('\n');
}
