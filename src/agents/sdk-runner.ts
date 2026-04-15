import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { ProviderConfig, AIProvider, RetryConfig } from '../types/index.js';

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-sonnet-4.6',
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
};

export function getDefaultModel(provider: AIProvider): string {
  return DEFAULT_MODELS[provider];
}

export function buildLanguageModel(
  providerConfig: ProviderConfig,
  modelId: string,
): LanguageModel {
  switch (providerConfig.provider) {
    case 'anthropic': {
      const p = createAnthropic({ apiKey: providerConfig.api_key });
      return p(modelId);
    }
    case 'openai': {
      const p = createOpenAI({ apiKey: providerConfig.api_key });
      return p(modelId);
    }
    case 'google': {
      const p = createGoogleGenerativeAI({ apiKey: providerConfig.api_key });
      return p(modelId);
    }
  }
}

export async function runWithSDK(opts: {
  providerConfig: ProviderConfig;
  model: string;
  systemPrompt: string;
  prompt: string;
  temperature?: number;
  retry?: RetryConfig;
  onVerbose?: (msg: string) => void;
}): Promise<string> {
  const { providerConfig, model, systemPrompt, prompt, temperature, retry, onVerbose } = opts;
  const maxRetries = retry?.maxRetries ?? 2;
  const baseDelayMs = retry?.baseDelayMs ?? 3000;

  const langModel = buildLanguageModel(providerConfig, model);

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { text } = await generateText({
        model: langModel,
        system: systemPrompt,
        prompt,
        ...(temperature !== undefined ? { temperature } : {}),
      });
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt >= maxRetries) throw lastError;

      const delay = baseDelayMs * Math.pow(2, attempt);
      onVerbose?.(
        `SDK attempt ${attempt + 1} failed (${lastError.message.slice(0, 80)}), retrying in ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw lastError;
}
