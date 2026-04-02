import { spawn } from 'child_process';
import type { AgentResult } from '../types/index.js';

export async function synthesize(
  brief: string,
  agentResults: AgentResult[],
  options?: { model?: string },
): Promise<string> {
  const agentSummaries = agentResults
    .map((r) => `### ${r.displayName}\n${r.output}`)
    .join('\n\n---\n\n');

  const prompt = `You are an experienced technical consultant. Below are analyses from different experts (Product Manager, CTO, Architect, etc.) about a project.

## Brief
${brief}

## Expert Analyses

${agentSummaries}

---

Your task: Synthesize all expert opinions into a concise **Executive Summary**.

Rules:
- Maximum 5-7 sentences
- Highlight consensus points across all experts
- Note any significant disagreements
- End with a concrete recommendation
- **LANGUAGE RULE:** Write the summary in the same language as the brief/analyses above
- Write only the summary text, no titles or markdown formatting`;

  const args = ['-p', '-', '--output-format', 'text'];
  if (options?.model) {
    args.push('--model', options.model);
  }

  const TIMEOUT_MS = 300_000; // 5 minutes for synthesis

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      reject(new Error(`Synthesizer timeout (${TIMEOUT_MS / 1000}s)`));
    }, TIMEOUT_MS);

    child.stdout.on('data', (data: Buffer) => { out += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { err += data.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return;
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${err.slice(0, 500)}`));
        return;
      }
      resolve(out);
    });

    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`claude CLI error: ${e.message}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });

  return stdout.trim();
}
