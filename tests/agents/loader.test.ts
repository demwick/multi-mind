import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadAgents, validateDag } from '../../src/agents/loader.js';
import type { AgentDefinition } from '../../src/types/index.js';

function makeAgent(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  return {
    name: 'test-agent',
    display_name: 'Test Agent',
    description: 'A test agent',
    phase: 1,
    depends_on: [],
    input_from: [],
    system_prompt: 'You are a test agent.',
    ...overrides,
  };
}

function writeYaml(dir: string, filename: string, content: string): void {
  writeFileSync(join(dir, filename), content, 'utf-8');
}

function agentYaml(agent: Partial<AgentDefinition>): string {
  const a = makeAgent(agent);
  return [
    `name: ${a.name}`,
    `display_name: "${a.display_name}"`,
    `description: "${a.description}"`,
    `phase: ${a.phase}`,
    `depends_on: [${(a.depends_on ?? []).map((d) => `"${d}"`).join(', ')}]`,
    `input_from: [${(a.input_from ?? []).map((i) => `"${i}"`).join(', ')}]`,
    `system_prompt: "You are a test agent."`,
  ].join('\n');
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'multi-mind-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadAgents', () => {
  it('loads a single YAML file from the directory', async () => {
    writeYaml(tmpDir, 'agent-a.yaml', agentYaml({ name: 'agent-a', phase: 1 }));
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('agent-a');
  });

  it('loads .yml extension files', async () => {
    writeYaml(tmpDir, 'agent-b.yml', agentYaml({ name: 'agent-b', phase: 1 }));
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('agent-b');
  });

  it('loads multiple YAML files', async () => {
    writeYaml(tmpDir, 'agent-a.yaml', agentYaml({ name: 'agent-a', phase: 1 }));
    writeYaml(tmpDir, 'agent-b.yaml', agentYaml({ name: 'agent-b', phase: 2 }));
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(2);
  });

  it('sorts agents by phase number', async () => {
    writeYaml(tmpDir, 'agent-c.yaml', agentYaml({ name: 'agent-c', phase: 3 }));
    writeYaml(tmpDir, 'agent-a.yaml', agentYaml({ name: 'agent-a', phase: 1 }));
    writeYaml(tmpDir, 'agent-b.yaml', agentYaml({ name: 'agent-b', phase: 2 }));
    const agents = await loadAgents(tmpDir);
    expect(agents.map((a) => a.phase)).toEqual([1, 2, 3]);
  });

  it('loads YAML files from custom/ subdirectory', async () => {
    const customDir = join(tmpDir, 'custom');
    mkdirSync(customDir);
    writeYaml(tmpDir, 'main.yaml', agentYaml({ name: 'main-agent', phase: 1 }));
    writeYaml(customDir, 'custom-agent.yaml', agentYaml({ name: 'custom-agent', phase: 2 }));
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(2);
    const names = agents.map((a) => a.name);
    expect(names).toContain('main-agent');
    expect(names).toContain('custom-agent');
  });

  it('returns empty array for directory with no YAML files', async () => {
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(0);
  });

  it('ignores non-YAML files', async () => {
    writeFileSync(join(tmpDir, 'readme.md'), '# readme');
    writeFileSync(join(tmpDir, 'config.json'), '{}');
    writeYaml(tmpDir, 'agent.yaml', agentYaml({ name: 'agent', phase: 1 }));
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(1);
  });

  it('loads system_prompt from external file when system_prompt_file is set', async () => {
    const promptsDir = join(tmpDir, 'prompts');
    mkdirSync(promptsDir);
    writeFileSync(join(promptsDir, 'my-prompt.md'), 'You are an external agent.', 'utf-8');
    const yaml = [
      'name: ext-agent',
      'display_name: "Ext Agent"',
      'description: "test"',
      'phase: 1',
      'depends_on: []',
      'input_from: []',
      'system_prompt_file: prompts/my-prompt.md',
    ].join('\n');
    writeYaml(tmpDir, 'ext-agent.yaml', yaml);
    const agents = await loadAgents(tmpDir);
    expect(agents).toHaveLength(1);
    expect(agents[0].system_prompt).toBe('You are an external agent.');
  });

  it('system_prompt_file overrides inline system_prompt', async () => {
    const promptsDir = join(tmpDir, 'prompts');
    mkdirSync(promptsDir);
    writeFileSync(join(promptsDir, 'override.md'), 'External prompt content.', 'utf-8');
    const yaml = [
      'name: override-agent',
      'display_name: "Override Agent"',
      'description: "test"',
      'phase: 1',
      'depends_on: []',
      'input_from: []',
      'system_prompt: "Inline prompt."',
      'system_prompt_file: prompts/override.md',
    ].join('\n');
    writeYaml(tmpDir, 'override-agent.yaml', yaml);
    const agents = await loadAgents(tmpDir);
    expect(agents[0].system_prompt).toBe('External prompt content.');
  });

  it('throws when system_prompt_file references a missing file', async () => {
    const yaml = [
      'name: missing-prompt-agent',
      'display_name: "Missing"',
      'description: "test"',
      'phase: 1',
      'depends_on: []',
      'input_from: []',
      'system_prompt_file: prompts/does-not-exist.md',
    ].join('\n');
    writeYaml(tmpDir, 'missing-agent.yaml', yaml);
    await expect(loadAgents(tmpDir)).rejects.toThrow('System prompt file not found');
  });

  it('throws when agent has neither system_prompt nor system_prompt_file', async () => {
    const yaml = [
      'name: no-prompt-agent',
      'display_name: "No Prompt"',
      'description: "test"',
      'phase: 1',
      'depends_on: []',
      'input_from: []',
    ].join('\n');
    writeYaml(tmpDir, 'no-prompt-agent.yaml', yaml);
    await expect(loadAgents(tmpDir)).rejects.toThrow('has no system_prompt or system_prompt_file');
  });
});

describe('validateDag', () => {
  it('returns valid for agents with no dependencies', () => {
    const agents = [
      makeAgent({ name: 'a', phase: 1, depends_on: [], input_from: [] }),
      makeAgent({ name: 'b', phase: 2, depends_on: [], input_from: [] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for a proper dependency chain', () => {
    const agents = [
      makeAgent({ name: 'pm', phase: 1, depends_on: [], input_from: [] }),
      makeAgent({ name: 'cto', phase: 2, depends_on: ['pm'], input_from: ['pm'] }),
      makeAgent({ name: 'arch', phase: 3, depends_on: ['pm', 'cto'], input_from: ['pm', 'cto'] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing depends_on reference', () => {
    const agents = [
      makeAgent({ name: 'agent-b', phase: 2, depends_on: ['nonexistent'], input_from: [] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true);
  });

  it('detects missing input_from reference', () => {
    const agents = [
      makeAgent({ name: 'agent-b', phase: 2, depends_on: [], input_from: ['ghost-agent'] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ghost-agent'))).toBe(true);
  });

  it('detects circular dependency', () => {
    const agents = [
      makeAgent({ name: 'a', phase: 1, depends_on: ['b'], input_from: [] }),
      makeAgent({ name: 'b', phase: 2, depends_on: ['a'], input_from: [] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('circular'))).toBe(true);
  });

  it('detects self-referencing circular dependency', () => {
    const agents = [
      makeAgent({ name: 'a', phase: 1, depends_on: ['a'], input_from: [] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes('circular'))).toBe(true);
  });

  it('collects multiple errors', () => {
    const agents = [
      makeAgent({ name: 'x', phase: 1, depends_on: ['missing1'], input_from: ['missing2'] }),
    ];
    const result = validateDag(agents);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
