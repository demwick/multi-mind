import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';
import { loadConfig } from '../../src/config/loader.js';
import { mergeConfig } from '../../src/config/merge.js';
import type { MultiMindConfig } from '../../src/config/loader.js';

function makeTmpDir(): string {
  const dir = join(os.tmpdir(), `multimind-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads config from the current directory', () => {
    const config = `model: claude-sonnet-4-6\noutput_dir: reports/\n`;
    writeFileSync(join(tmpDir, '.multimindrc.yaml'), config, 'utf-8');

    const result = loadConfig(tmpDir);
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.output_dir).toBe('reports/');
  });

  it('returns empty object when no config file exists', () => {
    const result = loadConfig(tmpDir);
    expect(result).toEqual({});
  });

  it('supports .multimindrc.yml extension', () => {
    const config = `language: en\n`;
    writeFileSync(join(tmpDir, '.multimindrc.yml'), config, 'utf-8');

    const result = loadConfig(tmpDir);
    expect(result.language).toBe('en');
  });

  it('walks up parent directories to find config', () => {
    const config = `model: claude-opus-4-5\nagents_dir: ./custom-agents/\n`;
    writeFileSync(join(tmpDir, '.multimindrc.yaml'), config, 'utf-8');

    // Create a nested child directory and start from there
    const childDir = join(tmpDir, 'sub', 'nested');
    mkdirSync(childDir, { recursive: true });

    const result = loadConfig(childDir);
    expect(result.model).toBe('claude-opus-4-5');
    expect(result.agents_dir).toBe('./custom-agents/');
  });

  it('loads agents list from config', () => {
    const config = `agents:\n  - product-manager\n  - cto\n  - architect\n`;
    writeFileSync(join(tmpDir, '.multimindrc.yaml'), config, 'utf-8');

    const result = loadConfig(tmpDir);
    expect(result.agents).toEqual(['product-manager', 'cto', 'architect']);
  });

  it('returns empty object for an empty config file', () => {
    writeFileSync(join(tmpDir, '.multimindrc.yaml'), '', 'utf-8');
    const result = loadConfig(tmpDir);
    expect(result).toEqual({});
  });

  it('prefers .multimindrc.yaml over .multimindrc.yml when both exist', () => {
    writeFileSync(join(tmpDir, '.multimindrc.yaml'), 'model: from-yaml\n', 'utf-8');
    writeFileSync(join(tmpDir, '.multimindrc.yml'), 'model: from-yml\n', 'utf-8');

    const result = loadConfig(tmpDir);
    expect(result.model).toBe('from-yaml');
  });
});

describe('mergeConfig', () => {
  it('CLI options override file config', () => {
    const fileConfig: MultiMindConfig = {
      model: 'claude-opus-4-5',
      output_dir: 'reports/',
      language: 'tr',
    };
    const cliOpts: Partial<MultiMindConfig> = {
      model: 'claude-sonnet-4-6',
      output_dir: 'out/',
    };

    const result = mergeConfig(fileConfig, cliOpts);
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.output_dir).toBe('out/');
    expect(result.language).toBe('tr'); // from file
  });

  it('file config is used when CLI option is undefined', () => {
    const fileConfig: MultiMindConfig = {
      model: 'claude-opus-4-5',
      agents_dir: './my-agents/',
      agents: ['product-manager', 'cto'],
    };
    const cliOpts: Partial<MultiMindConfig> = {};

    const result = mergeConfig(fileConfig, cliOpts);
    expect(result.model).toBe('claude-opus-4-5');
    expect(result.agents_dir).toBe('./my-agents/');
    expect(result.agents).toEqual(['product-manager', 'cto']);
  });

  it('returns undefined for fields not set in either source', () => {
    const result = mergeConfig({}, {});
    expect(result.model).toBeUndefined();
    expect(result.output_dir).toBeUndefined();
    expect(result.agents_dir).toBeUndefined();
    expect(result.language).toBeUndefined();
    expect(result.agents).toBeUndefined();
  });

  it('CLI agents list overrides file agents list', () => {
    const fileConfig: MultiMindConfig = { agents: ['product-manager'] };
    const cliOpts: Partial<MultiMindConfig> = { agents: ['cto', 'architect'] };

    const result = mergeConfig(fileConfig, cliOpts);
    expect(result.agents).toEqual(['cto', 'architect']);
  });
});
