import type { AgentResult, PipelineResult } from '../types/index.js';

export function generateSummary(result: PipelineResult, executiveSummary?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const durationSec = (result.totalDurationMs / 1000).toFixed(2);
  const numRounds = result.rounds ? result.rounds.length : 1;
  const isMultiRound = numRounds > 1;

  const sections = result.agents.map((agent) => {
    const isFailed = agent.structured === null && agent.output.startsWith('HATA:');
    if (isFailed) {
      const errorDetail = agent.output.replace(/^HATA:\s*/, '');
      return `## ${agent.displayName} ⚠️ HATA\n\n> Bu ajan çalıştırılırken hata oluştu: ${errorDetail}`;
    }
    const heading = isMultiRound
      ? `## ${agent.displayName} (Revize Edilmis)`
      : `## ${agent.displayName}`;
    return `${heading}\n\n${agent.output}`;
  });

  const parts = [
    `# multi-mind Analiz Raporu`,
    ``,
    `**Tarih:** ${date}`,
    `**Brief:** ${result.brief}`,
    `**Toplam Süre:** ${durationSec}s`,
  ];

  if (isMultiRound) {
    parts.push(`**Analiz Turlari:** ${numRounds}`);
  }

  parts.push(``, `---`, ``);

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
