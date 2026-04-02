import { createInterface } from 'readline';

export async function collectBrief(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on('SIGINT', () => {
    console.log('\nCancelled.');
    rl.close();
    process.exit(0);
  });

  const ask = (question: string, required = false, defaultValue = ''): Promise<string> => {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} (default: ${defaultValue})\n> ` : `${question}\n> `;

      const ask_ = () => {
        rl.question(prompt, (answer) => {
          const value = answer.trim() || defaultValue;
          if (required && !value) {
            console.log('This field is required, please enter a value.');
            ask_();
          } else {
            resolve(value);
          }
        });
      };

      ask_();
    });
  };

  console.log('\nMulti-Mind Project Brief\n' + '='.repeat(30));

  const name = await ask('Project name:', true);
  const description = await ask('Brief description:', true);
  const platform = await ask('Target platform? (web / mobile / desktop / API / other)', false, 'web');
  const audience = await ask('Who is the target audience?', false);
  const tech = await ask('Preferred technologies? (e.g. React, Node.js, PostgreSQL)', false);
  const constraints = await ask('Any budget/time constraints?', false);
  const notes = await ask('Special requirements or notes?', false);

  rl.close();

  const lines: string[] = [
    `Project: ${name}`,
    `Description: ${description}`,
    `Platform: ${platform}`,
  ];

  if (audience) lines.push(`Target Audience: ${audience}`);
  if (tech) lines.push(`Technologies: ${tech}`);
  if (constraints) lines.push(`Constraints: ${constraints}`);
  if (notes) lines.push(`Notes: ${notes}`);

  return lines.join('\n');
}
