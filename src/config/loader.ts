import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import os from 'os';
import { parse } from 'yaml';
import type { ProviderConfig, AIProvider } from '../types/index.js';

export interface MultiMindConfig {
  model?: string;
  output_dir?: string;
  agents_dir?: string;
  language?: string;
  agents?: string[];
  retry?: {
    max_retries?: number;
    base_delay_ms?: number;
  };
  profiles?: Array<{ name: string; config_dir: string }>;
  provider?: string;
  api_key?: string;
}

const CONFIG_FILENAMES = ['.multimindrc.yaml', '.multimindrc.yml'];

export function loadConfig(startDir?: string): MultiMindConfig {
  const homeDir = os.homedir();
  let currentDir = startDir ?? process.cwd();

  while (true) {
    for (const filename of CONFIG_FILENAMES) {
      const filePath = join(currentDir, filename);
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8');
        const parsed = parse(raw) as MultiMindConfig | null;
        return parsed ?? {};
      }
    }

    // Stop after checking the home directory
    if (currentDir === homeDir) {
      break;
    }

    const parent = dirname(currentDir);
    // Stop if we can't go further up (e.g. filesystem root)
    if (parent === currentDir) {
      break;
    }

    currentDir = parent;
  }

  return {};
}

const VALID_PROVIDERS: AIProvider[] = ['anthropic', 'openai', 'google'];

export function extractProviderConfig(config: MultiMindConfig): ProviderConfig | undefined {
  if (!config.api_key || !config.provider) return undefined;
  if (!(VALID_PROVIDERS as string[]).includes(config.provider)) {
    throw new Error(
      `Unknown provider "${config.provider}". Valid providers: ${VALID_PROVIDERS.join(', ')}`
    );
  }
  return {
    provider: config.provider as AIProvider,
    api_key: config.api_key,
  };
}
