import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { PipelineResult } from '../types/index.js';
import { generateSummary, generateAgentReport } from './markdown.js';
import { generateDecisionsYaml, generateAgentYaml, generateMeta } from './structured.js';

export function writeOutput(result: PipelineResult, outputDir: string, executiveSummary?: string): void {
  const agentsDir = join(outputDir, 'agents');
  mkdirSync(agentsDir, { recursive: true });

  writeFileSync(join(outputDir, 'summary.md'), generateSummary(result, executiveSummary), 'utf-8');
  writeFileSync(join(outputDir, 'decisions.yaml'), generateDecisionsYaml(result.agents), 'utf-8');
  writeFileSync(join(outputDir, 'meta.json'), JSON.stringify(generateMeta(result), null, 2), 'utf-8');

  for (const agent of result.agents) {
    writeFileSync(join(agentsDir, `${agent.agentName}.md`), generateAgentReport(agent), 'utf-8');
    writeFileSync(join(agentsDir, `${agent.agentName}.yaml`), generateAgentYaml(agent), 'utf-8');
  }
}
