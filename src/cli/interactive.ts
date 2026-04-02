import { createInterface } from 'readline';

export async function collectBrief(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    console.log('\nİptal edildi.');
    rl.close();
    process.exit(0);
  });

  const ask = (question: string, required = false, defaultValue = ''): Promise<string> => {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} (varsayılan: ${defaultValue})\n> ` : `${question}\n> `;

      const ask_ = () => {
        rl.question(prompt, (answer) => {
          const value = answer.trim() || defaultValue;
          if (required && !value) {
            console.log('Bu alan zorunludur, lütfen bir değer girin.');
            ask_();
          } else {
            resolve(value);
          }
        });
      };

      ask_();
    });
  };

  console.log('\nMulti-Mind Proje Briefingi\n' + '='.repeat(30));

  const name = await ask('Proje adı nedir?', true);
  const description = await ask('Projeyi kısaca tanımla:', true);
  const platform = await ask('Hedef platform? (web / mobil / desktop / API / diğer)', false, 'web');
  const audience = await ask('Hedef kitle kimdir?', false);
  const tech = await ask('Tercih edilen teknolojiler var mı? (örn: React, Node.js, PostgreSQL)', false);
  const constraints = await ask('Proje bütçe/zaman kısıtı var mı?', false);
  const notes = await ask('Özel gereksinimler veya notlar?', false);

  rl.close();

  const lines: string[] = [
    `Proje: ${name}`,
    `Açıklama: ${description}`,
    `Platform: ${platform}`,
  ];

  if (audience) lines.push(`Hedef Kitle: ${audience}`);
  if (tech) lines.push(`Teknolojiler: ${tech}`);
  if (constraints) lines.push(`Kısıtlar: ${constraints}`);
  if (notes) lines.push(`Notlar: ${notes}`);

  return lines.join('\n');
}
