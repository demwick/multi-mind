import type { AgentResult, PipelineResult } from '../types/index.js';

export function generateSummary(result: PipelineResult, executiveSummary?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const durationSec = (result.totalDurationMs / 1000).toFixed(2);

  const sections = result.agents.map((agent) => {
    return `## ${agent.displayName}\n\n${agent.output}`;
  });

  const parts = [
    `# multi-mind Analiz Raporu`,
    ``,
    `**Tarih:** ${date}`,
    `**Brief:** ${result.brief}`,
    `**Toplam Süre:** ${durationSec}s`,
    ``,
    `---`,
    ``,
  ];

  if (executiveSummary) {
    parts.push(`## Yönetici Özeti`, ``, executiveSummary, ``, `---`, ``);
  }

  parts.push(sections.join('\n\n---\n\n'));

  return parts.join('\n');
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
