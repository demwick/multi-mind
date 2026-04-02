import type { AgentResult, PipelineResult } from '../types/index.js';

export function generateSummary(result: PipelineResult): string {
  const date = new Date().toISOString().split('T')[0];
  const durationSec = (result.totalDurationMs / 1000).toFixed(2);

  const sections = result.agents.map((agent) => {
    return `## ${agent.displayName}\n\n${agent.output}`;
  });

  return [
    `# multi-mind Analiz Raporu`,
    ``,
    `**Tarih:** ${date}`,
    `**Brief:** ${result.brief}`,
    `**Toplam Süre:** ${durationSec}s`,
    ``,
    `---`,
    ``,
    sections.join('\n\n---\n\n'),
  ].join('\n');
}

export function generateAgentReport(agent: AgentResult): string {
  return [
    `# ${agent.displayName}`,
    ``,
    `**Agent:** ${agent.agentName}`,
    `**Süre:** ${agent.durationMs}ms`,
    `**Zaman:** ${agent.timestamp}`,
    ``,
    `---`,
    ``,
    agent.output,
  ].join('\n');
}
