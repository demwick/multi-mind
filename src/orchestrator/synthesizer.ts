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

  const prompt = `Sen deneyimli bir teknik danışmansın. Aşağıda bir projeyle ilgili farklı uzmanların (Product Manager, CTO, Architect vb.) analizleri var.

## Brief
${brief}

## Uzman Analizleri

${agentSummaries}

---

Görevin: Tüm uzman görüşlerini sentezleyerek kısa ve öz bir **Yönetici Özeti** yaz.

Kurallar:
- Maksimum 5-7 cümle
- Tüm uzmanların ortak noktalarını vurgula
- Varsa önemli ayrışma noktalarını belirt
- Somut bir sonuç/öneri ile bitir
- Türkçe yaz
- Sadece özet metnini yaz, başlık veya markdown formatı ekleme`;

  const args = ['-p', '-', '--output-format', 'text'];
  if (options?.model) {
    args.push('--model', options.model);
  }

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn('claude', args, {
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';

    child.stdout.on('data', (data: Buffer) => { out += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { err += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${err.slice(0, 500)}`));
        return;
      }
      resolve(out);
    });

    child.on('error', (e) => {
      reject(new Error(`claude CLI error: ${e.message}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });

  return stdout.trim();
}
