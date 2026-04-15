import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'mock-anthropic-model')),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'mock-openai-model')),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-google-model')),
}));

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { buildLanguageModel, runWithSDK, getDefaultModel } from '../../src/agents/sdk-runner.js';
import type { ProviderConfig } from '../../src/types/index.js';

const mockGenerateText = vi.mocked(generateText);
const mockCreateAnthropic = vi.mocked(createAnthropic);
const mockCreateOpenAI = vi.mocked(createOpenAI);
const mockCreateGoogle = vi.mocked(createGoogleGenerativeAI);

const anthropicConfig: ProviderConfig = { provider: 'anthropic', api_key: 'sk-ant-test' };
const openaiConfig: ProviderConfig = { provider: 'openai', api_key: 'sk-oai-test' };
const googleConfig: ProviderConfig = { provider: 'google', api_key: 'ggl-test' };

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateText.mockResolvedValue({ text: 'mock response' } as Awaited<ReturnType<typeof generateText>>);
});

describe('getDefaultModel', () => {
  it('returns correct defaults per provider', () => {
    expect(getDefaultModel('anthropic')).toBe('claude-sonnet-4.6');
    expect(getDefaultModel('openai')).toBe('gpt-4o');
    expect(getDefaultModel('google')).toBe('gemini-2.0-flash');
  });
});

describe('buildLanguageModel', () => {
  it('calls createAnthropic for anthropic provider', () => {
    buildLanguageModel(anthropicConfig, 'claude-sonnet-4.6');
    expect(mockCreateAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test' });
  });

  it('calls createOpenAI for openai provider', () => {
    buildLanguageModel(openaiConfig, 'gpt-4o');
    expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-oai-test' });
  });

  it('calls createGoogleGenerativeAI for google provider', () => {
    buildLanguageModel(googleConfig, 'gemini-2.0-flash');
    expect(mockCreateGoogle).toHaveBeenCalledWith({ apiKey: 'ggl-test' });
  });
});

describe('runWithSDK', () => {
  it('returns text from generateText on success', async () => {
    const result = await runWithSDK({
      providerConfig: anthropicConfig,
      model: 'claude-sonnet-4.6',
      systemPrompt: 'You are a helpful agent.',
      prompt: 'Analyze this.',
    });
    expect(result).toBe('mock response');
  });

  it('passes system and prompt separately to generateText', async () => {
    await runWithSDK({
      providerConfig: anthropicConfig,
      model: 'claude-sonnet-4.6',
      systemPrompt: 'system here',
      prompt: 'user here',
    });
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'system here', prompt: 'user here' })
    );
  });

  it('passes temperature when provided', async () => {
    await runWithSDK({
      providerConfig: anthropicConfig,
      model: 'claude-sonnet-4.6',
      systemPrompt: 'sys',
      prompt: 'prompt',
      temperature: 0.7,
    });
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.7 })
    );
  });

  it('omits temperature when not provided', async () => {
    await runWithSDK({
      providerConfig: anthropicConfig,
      model: 'claude-sonnet-4.6',
      systemPrompt: 'sys',
      prompt: 'prompt',
    });
    const call = mockGenerateText.mock.calls[0][0];
    expect(call).not.toHaveProperty('temperature');
  });

  it('retries on error up to maxRetries, then throws', async () => {
    const err = new Error('rate limit');
    mockGenerateText.mockRejectedValue(err);

    await expect(
      runWithSDK({
        providerConfig: anthropicConfig,
        model: 'claude-sonnet-4.6',
        systemPrompt: 'sys',
        prompt: 'prompt',
        retry: { maxRetries: 2, baseDelayMs: 1 },
      })
    ).rejects.toThrow('rate limit');

    expect(mockGenerateText).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('does not retry when maxRetries is 0', async () => {
    mockGenerateText.mockRejectedValue(new Error('fail'));

    await expect(
      runWithSDK({
        providerConfig: anthropicConfig,
        model: 'claude-sonnet-4.6',
        systemPrompt: 'sys',
        prompt: 'prompt',
        retry: { maxRetries: 0, baseDelayMs: 1 },
      })
    ).rejects.toThrow('fail');

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
  });

  it('calls onVerbose on each retry', async () => {
    const err = new Error('transient error');
    mockGenerateText
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue({ text: 'ok' } as Awaited<ReturnType<typeof generateText>>);

    const onVerbose = vi.fn();
    await runWithSDK({
      providerConfig: anthropicConfig,
      model: 'claude-sonnet-4.6',
      systemPrompt: 'sys',
      prompt: 'prompt',
      retry: { maxRetries: 3, baseDelayMs: 1 },
      onVerbose,
    });

    expect(onVerbose).toHaveBeenCalledTimes(2);
    expect(onVerbose.mock.calls[0][0]).toContain('attempt 1 failed');
  });
});
