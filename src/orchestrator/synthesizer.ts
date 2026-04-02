import { execFile } from 'child_process';
import { promisify } from 'util';
import type { AgentResult } from '../types/index.js';

const execFileAsync = promisify(execFile);

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

  const args = ['-p', prompt, '--output-format', 'text'];
  if (options?.model) {
    args.push('--model', options.model);
  }

  const { stdout } = await execFileAsync('claude', args, {
    timeout: 120_000,
    maxBuffer: 5 * 1024 * 1024,
    env: { ...process.env },
  });

  return stdout.trim();
}
