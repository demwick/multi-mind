import { parse } from 'yaml';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';
import type { AgentDefinition } from '../types/index.js';

function collectYamlFiles(dir: string): string[] {
  const files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectYamlFiles(fullPath));
    } else {
      const ext = extname(entry).toLowerCase();
      if (ext === '.yaml' || ext === '.yml') {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export async function loadAgents(agentsDir: string): Promise<AgentDefinition[]> {
  const yamlFiles = collectYamlFiles(agentsDir);
  const agents: AgentDefinition[] = [];

  for (const filePath of yamlFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parse(content) as AgentDefinition;

    if (parsed.system_prompt_file) {
      const resolvedPath = resolve(dirname(filePath), parsed.system_prompt_file);
      if (!existsSync(resolvedPath)) {
        throw new Error(`System prompt file not found: ${resolvedPath} (agent: ${parsed.name})`);
      }
      parsed.system_prompt = readFileSync(resolvedPath, 'utf-8');
    } else if (!parsed.system_prompt) {
      throw new Error(`Agent "${parsed.name}" has no system_prompt or system_prompt_file`);
    }

    agents.push(parsed);
  }

  agents.sort((a, b) => a.phase - b.phase);
  return agents;
}

export function validateDag(agents: AgentDefinition[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nameSet = new Set(agents.map((a) => a.name));

  for (const agent of agents) {
    for (const dep of agent.depends_on ?? []) {
      if (!nameSet.has(dep)) {
        errors.push(`Agent "${agent.name}" has unknown depends_on: "${dep}"`);
      }
    }
    for (const src of agent.input_from ?? []) {
      if (!nameSet.has(src)) {
        errors.push(`Agent "${agent.name}" has unknown input_from: "${src}"`);
      }
    }
  }

  // Detect circular dependencies via DFS
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const a of agents) color.set(a.name, WHITE);

  const adjMap = new Map<string, string[]>();
  for (const a of agents) {
    adjMap.set(a.name, [...(a.depends_on ?? [])]);
  }

  const dfs = (node: string, path: string[]): boolean => {
    color.set(node, GRAY);
    for (const neighbor of adjMap.get(node) ?? []) {
      if (!color.has(neighbor)) continue; // already reported as missing
      if (color.get(neighbor) === GRAY) {
        errors.push(`Circular dependency detected: ${[...path, node, neighbor].join(' -> ')}`);
        return true;
      }
      if (color.get(neighbor) === WHITE) {
        if (dfs(neighbor, [...path, node])) return true;
      }
    }
    color.set(node, BLACK);
    return false;
  };

  for (const a of agents) {
    if (color.get(a.name) === WHITE) {
      dfs(a.name, []);
    }
  }

  return { valid: errors.length === 0, errors };
}
