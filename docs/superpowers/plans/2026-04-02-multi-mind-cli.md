# multi-mind CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an open-source CLI that orchestrates multiple AI agents (via `claude -p`) to produce professional technical analysis reports.

**Architecture:** Uses `@jackchen_me/open-multi-agent` for orchestration primitives (TaskQueue, Scheduler, SharedMemory) but NOT for Agent/AgentRunner — because those create LLM adapters internally via API keys. Instead, we write a thin `ClaudeCliRunner` that calls `claude -p` via child_process. YAML-defined agents feed into the orchestration pipeline; output is Markdown + YAML.

**Tech Stack:** TypeScript, Node.js >= 18 (ESM), Commander.js, `@jackchen_me/open-multi-agent`, `yaml`, `ora`

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, bin entry, scripts |
| `tsconfig.json` | TypeScript config (ESM, strict) |
| `src/types/index.ts` | Shared type definitions (AgentDefinition, PipelineResult, RunMeta) |
| `src/agents/loader.ts` | YAML dosyalarını okur, AgentDefinition[] döndürür, DAG validate eder |
| `src/agents/claude-runner.ts` | `claude -p` CLI çağrısı yapan ajan çalıştırıcı |
| `src/orchestrator/pipeline.ts` | TaskQueue + Scheduler + SharedMemory ile DAG orkestrasyon |
| `src/output/markdown.ts` | Markdown rapor üretici (summary.md + per-agent .md) |
| `src/output/structured.ts` | YAML/JSON çıktı üretici (decisions.yaml + per-agent .yaml + meta.json) |
| `src/context/brief-parser.ts` | Brief metnini yapılandırır |
| `src/context/project-loader.ts` | Codebase'den context çıkarır |
| `src/cli/index.ts` | Commander.js giriş noktası, global flagler |
| `src/cli/commands/new.ts` | `multi-mind new` komutu |
| `src/cli/commands/agents.ts` | `multi-mind agents list\|init` komutu |
| `src/cli/commands/rerun.ts` | `multi-mind rerun` komutu |
| `src/cli/commands/debate.ts` | `multi-mind debate` komutu |
| `src/cli/commands/decide.ts` | `multi-mind decide` komutu |
| `src/cli/commands/analyze.ts` | `multi-mind analyze` komutu |
| `agents/product-manager.yaml` | PM ajan tanımı |
| `agents/cto.yaml` | CTO ajan tanımı |
| `agents/architect.yaml` | Architect ajan tanımı |
| `tests/agents/loader.test.ts` | Loader testleri |
| `tests/agents/claude-runner.test.ts` | Runner testleri (mock child_process) |
| `tests/orchestrator/pipeline.test.ts` | Pipeline testleri |
| `tests/output/markdown.test.ts` | Markdown output testleri |
| `tests/output/structured.test.ts` | Structured output testleri |
| `tests/context/brief-parser.test.ts` | Brief parser testleri |
| `tests/cli/new.test.ts` | New komutu entegrasyon testi |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "multi-mind",
  "version": "0.1.0",
  "description": "Open source multi-agent decision system powered by Claude",
  "type": "module",
  "bin": {
    "multi-mind": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT",
  "dependencies": {
    "@jackchen_me/open-multi-agent": "latest",
    "commander": "^12.0.0",
    "yaml": "^2.4.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "agents/**/*.yaml"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
output/
.superpowers/
*.tgz
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: Clean install, no errors. `node_modules/` created.

- [ ] **Step 5: Verify open-multi-agent imports work**

Create a temporary test file to verify:

Run: `npx tsx -e "import { TaskQueue, SharedMemory, Scheduler, createTask } from '@jackchen_me/open-multi-agent'; console.log('OK:', typeof TaskQueue, typeof SharedMemory)"`
Expected: `OK: function function`

- [ ] **Step 6: Create directory structure**

Run: `mkdir -p src/cli/commands src/agents src/orchestrator src/context src/output src/types agents/custom tests/agents tests/orchestrator tests/output tests/context tests/cli`

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json .gitignore package-lock.json
git commit -m "chore: scaffold project with dependencies"
```

---

### Task 2: Shared Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write type definitions**

```typescript
// src/types/index.ts

export interface AgentDefinition {
  name: string;
  display_name: string;
  description: string;
  phase: number;
  depends_on: string[];
  input_from: string[];
  model?: string;
  temperature?: number;
  system_prompt: string;
  output_schema?: Record<string, unknown>;
}

export interface AgentResult {
  agentName: string;
  displayName: string;
  output: string;
  structured: Record<string, unknown> | null;
  durationMs: number;
  timestamp: string;
}

export interface PipelineResult {
  success: boolean;
  brief: string;
  agents: AgentResult[];
  totalDurationMs: number;
}

export interface RunMeta {
  version: string;
  created_at: string;
  brief: string;
  agents_used: string[];
  dag_execution: {
    total_duration_ms: number;
    agents: Record<string, { duration_ms: number }>;
  };
}

export interface GlobalOptions {
  verbose: boolean;
  outputDir: string;
  model?: string;
  agents?: string[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: YAML Agent Loader

**Files:**
- Create: `tests/agents/loader.test.ts`
- Create: `src/agents/loader.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/agents/loader.test.ts
import { describe, it, expect } from 'vitest';
import { loadAgents, validateDag } from '../src/agents/loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const TMP = join(tmpdir(), 'multi-mind-test-' + Date.now());

function writeAgent(dir: string, filename: string, content: Record<string, unknown>) {
  const { stringify } = await import('yaml');
  writeFileSync(join(dir, filename), stringify(content));
}

describe('loadAgents', () => {
  beforeEach(() => {
    mkdirSync(TMP, { recursive: true });
    mkdirSync(join(TMP, 'custom'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('loads YAML agent definitions from directory', async () => {
    writeAgent(TMP, 'pm.yaml', {
      name: 'product-manager',
      display_name: 'Product Manager',
      description: 'Manages product',
      phase: 1,
      depends_on: [],
      input_from: [],
      system_prompt: 'You are a PM.',
    });

    const agents = await loadAgents(TMP);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('product-manager');
    expect(agents[0].system_prompt).toBe('You are a PM.');
  });

  it('loads agents from custom/ subdirectory too', async () => {
    writeAgent(TMP, 'pm.yaml', {
      name: 'product-manager',
      display_name: 'PM',
      description: 'PM',
      phase: 1,
      depends_on: [],
      input_from: [],
      system_prompt: 'PM prompt',
    });
    writeAgent(join(TMP, 'custom'), 'sec.yaml', {
      name: 'security',
      display_name: 'Security',
      description: 'Security',
      phase: 2,
      depends_on: ['product-manager'],
      input_from: ['product-manager'],
      system_prompt: 'Sec prompt',
    });

    const agents = await loadAgents(TMP);
    expect(agents).toHaveLength(2);
  });

  it('sorts agents by phase', async () => {
    writeAgent(TMP, 'arch.yaml', {
      name: 'architect',
      display_name: 'Architect',
      description: 'Arch',
      phase: 3,
      depends_on: ['cto'],
      input_from: ['cto'],
      system_prompt: 'Arch prompt',
    });
    writeAgent(TMP, 'cto.yaml', {
      name: 'cto',
      display_name: 'CTO',
      description: 'CTO',
      phase: 2,
      depends_on: [],
      input_from: [],
      system_prompt: 'CTO prompt',
    });

    const agents = await loadAgents(TMP);
    expect(agents[0].name).toBe('cto');
    expect(agents[1].name).toBe('architect');
  });
});

describe('validateDag', () => {
  it('detects missing dependency', () => {
    const result = validateDag([
      {
        name: 'cto',
        display_name: 'CTO',
        description: 'CTO',
        phase: 2,
        depends_on: ['nonexistent'],
        input_from: [],
        system_prompt: 'x',
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('nonexistent');
  });

  it('passes for valid DAG', () => {
    const result = validateDag([
      {
        name: 'pm',
        display_name: 'PM',
        description: 'PM',
        phase: 1,
        depends_on: [],
        input_from: [],
        system_prompt: 'x',
      },
      {
        name: 'cto',
        display_name: 'CTO',
        description: 'CTO',
        phase: 2,
        depends_on: ['pm'],
        input_from: ['pm'],
        system_prompt: 'x',
      },
    ]);
    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/agents/loader.test.ts`
Expected: FAIL — `loadAgents` and `validateDag` not found

- [ ] **Step 3: Implement loader**

```typescript
// src/agents/loader.ts
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import type { AgentDefinition } from '../types/index.js';

export async function loadAgents(agentsDir: string): Promise<AgentDefinition[]> {
  const agents: AgentDefinition[] = [];

  const yamlFiles = collectYamlFiles(agentsDir);

  for (const filePath of yamlFiles) {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parse(raw) as AgentDefinition;
    agents.push({
      name: parsed.name,
      display_name: parsed.display_name,
      description: parsed.description,
      phase: parsed.phase,
      depends_on: parsed.depends_on ?? [],
      input_from: parsed.input_from ?? [],
      model: parsed.model,
      temperature: parsed.temperature,
      system_prompt: parsed.system_prompt,
      output_schema: parsed.output_schema,
    });
  }

  agents.sort((a, b) => a.phase - b.phase);
  return agents;
}

function collectYamlFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
      files.push(join(dir, entry.name));
    }
    if (entry.isDirectory()) {
      files.push(...collectYamlFiles(join(dir, entry.name)));
    }
  }

  return files;
}

export function validateDag(agents: AgentDefinition[]): { valid: boolean; errors: string[] } {
  const names = new Set(agents.map((a) => a.name));
  const errors: string[] = [];

  for (const agent of agents) {
    for (const dep of agent.depends_on) {
      if (!names.has(dep)) {
        errors.push(`Agent "${agent.name}" depends on "${dep}" which does not exist`);
      }
    }
    for (const inp of agent.input_from) {
      if (!names.has(inp)) {
        errors.push(`Agent "${agent.name}" has input_from "${inp}" which does not exist`);
      }
    }
  }

  // Cycle detection via DFS
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const adjMap = new Map<string, string[]>();
  for (const a of agents) {
    adjMap.set(a.name, a.depends_on);
  }

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);
    for (const dep of adjMap.get(node) ?? []) {
      if (!visited.has(dep)) {
        if (dfs(dep)) return true;
      } else if (inStack.has(dep)) {
        errors.push(`Circular dependency detected involving "${node}" and "${dep}"`);
        return true;
      }
    }
    inStack.delete(node);
    return false;
  }

  for (const a of agents) {
    if (!visited.has(a.name)) dfs(a.name);
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/agents/loader.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/agents/loader.ts tests/agents/loader.test.ts
git commit -m "feat: YAML agent loader with DAG validation"
```

---

### Task 4: Default Agent YAML Files

**Files:**
- Create: `agents/product-manager.yaml`
- Create: `agents/cto.yaml`
- Create: `agents/architect.yaml`

- [ ] **Step 1: Create Product Manager agent**

```yaml
# agents/product-manager.yaml
name: product-manager
display_name: "Product Manager"
description: "Brief analizi, gereksinim cikartma, onceliklendirme"
phase: 1
depends_on: []
input_from: []

system_prompt: |
  Sen 10+ yil deneyimli bir Product Manager'sin.

  Gorevlerin:
  - Kullanicinin brief'ini analiz et
  - Temel gereksinimleri cikar ve listele
  - User story'ler olustur
  - Onceliklendirme yap (must-have / nice-to-have / future)
  - Hedef kitle ve kullanim senaryolarini tanimla
  - MVP kapsami belirle

  Ciktini su yapisal formatta ver (YAML):
  requirements:
    must_have: [...]
    nice_to_have: [...]
    future: [...]
  user_stories: [...]
  target_audience: "..."
  mvp_scope: "..."
  risks: [...]

output_schema:
  type: object
  required:
    - requirements
    - user_stories
    - target_audience
    - mvp_scope
  properties:
    requirements:
      type: object
      properties:
        must_have:
          type: array
          items:
            type: string
        nice_to_have:
          type: array
          items:
            type: string
        future:
          type: array
          items:
            type: string
    user_stories:
      type: array
      items:
        type: string
    target_audience:
      type: string
    mvp_scope:
      type: string
    risks:
      type: array
      items:
        type: object
        properties:
          risk:
            type: string
          impact:
            type: string
            enum: [low, medium, high]
```

- [ ] **Step 2: Create CTO agent**

```yaml
# agents/cto.yaml
name: cto
display_name: "CTO / Tech Lead"
description: "Tech stack kararlari, teknik fizibilite, maliyet analizi"
phase: 2
depends_on:
  - product-manager
input_from:
  - product-manager

system_prompt: |
  Sen 15+ yil deneyimli bir CTO'sun.

  Onceki Product Manager analizi sana verilecek. Buna dayanarak:
  - Tech stack sec ve gerekcelendir
  - Teknik fizibilite analizi yap
  - Build vs buy kararlari ver
  - Maliyet ve zaman tahmini yap
  - Teknik riskleri degerlendir

  Ciktini su yapisal formatta ver (YAML):
  tech_stack:
    frontend: "..."
    backend: "..."
    database: "..."
    infrastructure: "..."
  rationale: "..."
  build_vs_buy: [...]
  risks:
    - risk: "..."
      severity: low|medium|high
      mitigation: "..."
  cost_estimate:
    time: "..."
    team_size: "..."
    monthly_cost: "..."

output_schema:
  type: object
  required:
    - tech_stack
    - rationale
    - risks
  properties:
    tech_stack:
      type: object
    rationale:
      type: string
    build_vs_buy:
      type: array
      items:
        type: object
        properties:
          component:
            type: string
          decision:
            type: string
            enum: [build, buy]
          reason:
            type: string
    risks:
      type: array
      items:
        type: object
        properties:
          risk:
            type: string
          severity:
            type: string
            enum: [low, medium, high]
          mitigation:
            type: string
    cost_estimate:
      type: object
```

- [ ] **Step 3: Create Architect agent**

```yaml
# agents/architect.yaml
name: architect
display_name: "Software Architect"
description: "Sistem mimarisi, modul yapisi, veri akisi, API tasarimi"
phase: 3
depends_on:
  - product-manager
  - cto
input_from:
  - product-manager
  - cto

system_prompt: |
  Sen 15+ yil deneyimli bir Software Architect'sin.

  Onceki Product Manager ve CTO analizleri sana verilecek. Bunlara dayanarak:
  - Sistem mimarisini tasarla
  - Modul/servis yapisini belirle
  - Veri modelini olustur
  - API tasarimi yap
  - Dizin yapisini oner
  - Entegrasyon noktalarini tanimla

  Ciktini su yapisal formatta ver (YAML):
  architecture_style: "..."
  modules:
    - name: "..."
      responsibility: "..."
      dependencies: [...]
  data_model:
    entities: [...]
  api_endpoints: [...]
  directory_structure: "..."
  integration_points: [...]
  deployment_strategy: "..."

output_schema:
  type: object
  required:
    - architecture_style
    - modules
    - data_model
  properties:
    architecture_style:
      type: string
    modules:
      type: array
      items:
        type: object
        properties:
          name:
            type: string
          responsibility:
            type: string
          dependencies:
            type: array
            items:
              type: string
    data_model:
      type: object
    api_endpoints:
      type: array
    directory_structure:
      type: string
    integration_points:
      type: array
    deployment_strategy:
      type: string
```

- [ ] **Step 4: Verify agents load correctly**

Run: `npx tsx -e "import { loadAgents, validateDag } from './src/agents/loader.js'; const a = await loadAgents('./agents'); console.log(a.map(x => x.name)); const v = validateDag(a); console.log('Valid:', v.valid);"`
Expected:
```
[ 'product-manager', 'cto', 'architect' ]
Valid: true
```

- [ ] **Step 5: Commit**

```bash
git add agents/product-manager.yaml agents/cto.yaml agents/architect.yaml
git commit -m "feat: add default agent definitions (PM, CTO, Architect)"
```

---

### Task 5: Claude CLI Runner

**Files:**
- Create: `tests/agents/claude-runner.test.ts`
- Create: `src/agents/claude-runner.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/agents/claude-runner.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPrompt, parseClaudeOutput } from '../src/agents/claude-runner.js';

describe('buildPrompt', () => {
  it('combines system prompt, context, and brief', () => {
    const prompt = buildPrompt({
      systemPrompt: 'You are a CTO.',
      brief: 'Build an e-commerce platform',
      previousOutputs: [
        { agentName: 'product-manager', output: 'Requirements: ...' },
      ],
    });

    expect(prompt).toContain('You are a CTO.');
    expect(prompt).toContain('Build an e-commerce platform');
    expect(prompt).toContain('product-manager');
    expect(prompt).toContain('Requirements: ...');
  });

  it('works without previous outputs', () => {
    const prompt = buildPrompt({
      systemPrompt: 'You are a PM.',
      brief: 'Build a todo app',
      previousOutputs: [],
    });

    expect(prompt).toContain('You are a PM.');
    expect(prompt).toContain('Build a todo app');
    expect(prompt).not.toContain('Onceki Ajan Ciktilari');
  });
});

describe('parseClaudeOutput', () => {
  it('extracts structured YAML from output', () => {
    const raw = `Here is my analysis:

\`\`\`yaml
tech_stack:
  frontend: Next.js
  backend: Node.js
\`\`\`

That's my recommendation.`;

    const result = parseClaudeOutput(raw);
    expect(result.structured).toEqual({
      tech_stack: { frontend: 'Next.js', backend: 'Node.js' },
    });
    expect(result.text).toBe(raw);
  });

  it('returns null structured when no YAML block found', () => {
    const raw = 'Just plain text analysis without structured data.';
    const result = parseClaudeOutput(raw);
    expect(result.structured).toBeNull();
    expect(result.text).toBe(raw);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/agents/claude-runner.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement claude-runner**

```typescript
// src/agents/claude-runner.ts
import { execFile } from 'child_process';
import { promisify } from 'util';
import { parse as parseYaml } from 'yaml';
import type { AgentDefinition, AgentResult } from '../types/index.js';

const execFileAsync = promisify(execFile);

interface PromptInput {
  systemPrompt: string;
  brief: string;
  previousOutputs: Array<{ agentName: string; output: string }>;
  feedback?: string;
}

export function buildPrompt(input: PromptInput): string {
  const parts: string[] = [];

  parts.push(input.systemPrompt);
  parts.push('');
  parts.push('---');
  parts.push('');

  if (input.previousOutputs.length > 0) {
    parts.push('## Onceki Ajan Ciktilari');
    parts.push('');
    for (const prev of input.previousOutputs) {
      parts.push(`### ${prev.agentName}`);
      parts.push(prev.output);
      parts.push('');
    }
    parts.push('---');
    parts.push('');
  }

  parts.push('## Brief');
  parts.push(input.brief);

  if (input.feedback) {
    parts.push('');
    parts.push('## Geri Bildirim');
    parts.push(input.feedback);
  }

  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('Lutfen analizini yap ve ciktini yapisal formatta (YAML code block icinde) ver.');

  return parts.join('\n');
}

export function parseClaudeOutput(raw: string): {
  text: string;
  structured: Record<string, unknown> | null;
} {
  const yamlMatch = raw.match(/```ya?ml\n([\s\S]*?)```/);

  let structured: Record<string, unknown> | null = null;
  if (yamlMatch) {
    try {
      structured = parseYaml(yamlMatch[1]) as Record<string, unknown>;
    } catch {
      structured = null;
    }
  }

  return { text: raw, structured };
}

export async function runAgent(
  agent: AgentDefinition,
  brief: string,
  previousOutputs: Array<{ agentName: string; output: string }>,
  options?: { feedback?: string; model?: string },
): Promise<AgentResult> {
  const prompt = buildPrompt({
    systemPrompt: agent.system_prompt,
    brief,
    previousOutputs,
    feedback: options?.feedback,
  });

  const startTime = Date.now();

  const args = ['-p', prompt, '--output-format', 'text'];
  if (options?.model) {
    args.push('--model', options.model);
  }

  const { stdout } = await execFileAsync('claude', args, {
    timeout: 300_000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env },
  });

  const durationMs = Date.now() - startTime;
  const { text, structured } = parseClaudeOutput(stdout);

  return {
    agentName: agent.name,
    displayName: agent.display_name,
    output: text,
    structured,
    durationMs,
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/agents/claude-runner.test.ts`
Expected: All tests PASS (we only test `buildPrompt` and `parseClaudeOutput`, not the actual `claude -p` call)

- [ ] **Step 5: Commit**

```bash
git add src/agents/claude-runner.ts tests/agents/claude-runner.test.ts
git commit -m "feat: claude -p CLI runner with prompt builder and output parser"
```

---

### Task 6: Orchestration Pipeline

**Files:**
- Create: `tests/orchestrator/pipeline.test.ts`
- Create: `src/orchestrator/pipeline.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/orchestrator/pipeline.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runPipeline } from '../src/orchestrator/pipeline.js';
import type { AgentDefinition } from '../src/types/index.js';

// Mock claude-runner to avoid actual claude -p calls
vi.mock('../src/agents/claude-runner.js', () => ({
  runAgent: vi.fn(async (agent: AgentDefinition) => ({
    agentName: agent.name,
    displayName: agent.display_name,
    output: `Mock output from ${agent.name}`,
    structured: { mock: true },
    durationMs: 100,
    timestamp: new Date().toISOString(),
  })),
}));

describe('runPipeline', () => {
  const agents: AgentDefinition[] = [
    {
      name: 'pm',
      display_name: 'PM',
      description: 'PM',
      phase: 1,
      depends_on: [],
      input_from: [],
      system_prompt: 'You are PM',
    },
    {
      name: 'cto',
      display_name: 'CTO',
      description: 'CTO',
      phase: 2,
      depends_on: ['pm'],
      input_from: ['pm'],
      system_prompt: 'You are CTO',
    },
    {
      name: 'arch',
      display_name: 'Architect',
      description: 'Architect',
      phase: 3,
      depends_on: ['pm', 'cto'],
      input_from: ['pm', 'cto'],
      system_prompt: 'You are Architect',
    },
  ];

  it('runs all agents in dependency order', async () => {
    const result = await runPipeline(agents, 'Build a todo app');

    expect(result.success).toBe(true);
    expect(result.agents).toHaveLength(3);
    expect(result.agents[0].agentName).toBe('pm');
    expect(result.agents[1].agentName).toBe('cto');
    expect(result.agents[2].agentName).toBe('arch');
  });

  it('passes previous outputs to dependent agents', async () => {
    const { runAgent } = await import('../src/agents/claude-runner.js');
    await runPipeline(agents, 'Build a todo app');

    // CTO should receive PM output
    const ctoCall = (runAgent as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(ctoCall[2]).toEqual([
      expect.objectContaining({ agentName: 'pm' }),
    ]);

    // Architect should receive PM + CTO outputs
    const archCall = (runAgent as ReturnType<typeof vi.fn>).mock.calls[2];
    expect(archCall[2]).toHaveLength(2);
  });

  it('includes brief in result', async () => {
    const result = await runPipeline(agents, 'Build a todo app');
    expect(result.brief).toBe('Build a todo app');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/orchestrator/pipeline.test.ts`
Expected: FAIL — `runPipeline` not found

- [ ] **Step 3: Implement pipeline**

```typescript
// src/orchestrator/pipeline.ts
import {
  TaskQueue,
  createTask,
  getTaskDependencyOrder,
  SharedMemory,
} from '@jackchen_me/open-multi-agent';
import { runAgent } from '../agents/claude-runner.js';
import type { AgentDefinition, AgentResult, PipelineResult } from '../types/index.js';

interface PipelineCallbacks {
  onAgentStart?: (agent: AgentDefinition) => void;
  onAgentComplete?: (result: AgentResult) => void;
  onAgentError?: (agent: AgentDefinition, error: Error) => void;
}

export async function runPipeline(
  agents: AgentDefinition[],
  brief: string,
  options?: {
    model?: string;
    callbacks?: PipelineCallbacks;
    filterAgents?: string[];
  },
): Promise<PipelineResult> {
  const startTime = Date.now();
  const results: AgentResult[] = [];
  const outputMap = new Map<string, AgentResult>();

  // Filter agents if specified
  let activeAgents = agents;
  if (options?.filterAgents) {
    activeAgents = agents.filter((a) => options.filterAgents!.includes(a.name));
  }

  // Sort by phase (should already be sorted from loader, but ensure)
  activeAgents.sort((a, b) => a.phase - b.phase);

  // Group by phase for parallel execution within same phase
  const phases = new Map<number, AgentDefinition[]>();
  for (const agent of activeAgents) {
    const group = phases.get(agent.phase) ?? [];
    group.push(agent);
    phases.set(agent.phase, group);
  }

  // Execute phase by phase
  for (const [, phaseAgents] of [...phases.entries()].sort(([a], [b]) => a - b)) {
    const phasePromises = phaseAgents.map(async (agent) => {
      options?.callbacks?.onAgentStart?.(agent);

      // Gather previous outputs from input_from agents
      const previousOutputs = agent.input_from
        .map((name) => outputMap.get(name))
        .filter((r): r is AgentResult => r !== undefined)
        .map((r) => ({ agentName: r.agentName, output: r.output }));

      try {
        const result = await runAgent(agent, brief, previousOutputs, {
          model: options?.model,
        });

        outputMap.set(agent.name, result);
        results.push(result);
        options?.callbacks?.onAgentComplete?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options?.callbacks?.onAgentError?.(agent, err);
        throw err;
      }
    });

    await Promise.all(phasePromises);
  }

  return {
    success: true,
    brief,
    agents: results,
    totalDurationMs: Date.now() - startTime,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/orchestrator/pipeline.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/orchestrator/pipeline.ts tests/orchestrator/pipeline.test.ts
git commit -m "feat: DAG pipeline with phase-based parallel execution"
```

---

### Task 7: Brief Parser

**Files:**
- Create: `tests/context/brief-parser.test.ts`
- Create: `src/context/brief-parser.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/context/brief-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseBrief, slugify } from '../src/context/brief-parser.js';

describe('parseBrief', () => {
  it('structures a simple brief', () => {
    const result = parseBrief('E-ticaret platformu, Next.js, multi-tenant');
    expect(result.raw).toBe('E-ticaret platformu, Next.js, multi-tenant');
    expect(result.slug).toMatch(/e-ticaret-platformu/);
  });
});

describe('slugify', () => {
  it('converts text to URL-safe slug', () => {
    expect(slugify('E-ticaret Platformu')).toBe('e-ticaret-platformu');
  });

  it('handles special characters', () => {
    expect(slugify('Next.js + React')).toBe('nextjs-react');
  });

  it('truncates long slugs', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/context/brief-parser.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement brief parser**

```typescript
// src/context/brief-parser.ts

export interface ParsedBrief {
  raw: string;
  slug: string;
  date: string;
  outputDir: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function parseBrief(brief: string, outputBase = 'output'): ParsedBrief {
  const date = new Date().toISOString().split('T')[0];
  const slug = slugify(brief.split(',')[0].trim());
  const outputDir = `${outputBase}/${date}-${slug}`;

  return {
    raw: brief,
    slug,
    date,
    outputDir,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/context/brief-parser.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/context/brief-parser.ts tests/context/brief-parser.test.ts
git commit -m "feat: brief parser with slugify"
```

---

### Task 8: Output — Markdown Report Generator

**Files:**
- Create: `tests/output/markdown.test.ts`
- Create: `src/output/markdown.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/output/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { generateSummary, generateAgentReport } from '../src/output/markdown.js';
import type { AgentResult, PipelineResult } from '../src/types/index.js';

const mockResults: AgentResult[] = [
  {
    agentName: 'product-manager',
    displayName: 'Product Manager',
    output: 'Requirements analysis complete.',
    structured: { requirements: { must_have: ['auth'] } },
    durationMs: 1000,
    timestamp: '2026-04-02T10:00:00Z',
  },
  {
    agentName: 'cto',
    displayName: 'CTO / Tech Lead',
    output: 'Tech stack selected: Next.js.',
    structured: { tech_stack: { frontend: 'Next.js' } },
    durationMs: 2000,
    timestamp: '2026-04-02T10:01:00Z',
  },
];

describe('generateSummary', () => {
  it('generates a summary markdown with all agent outputs', () => {
    const result: PipelineResult = {
      success: true,
      brief: 'E-ticaret platformu',
      agents: mockResults,
      totalDurationMs: 3000,
    };

    const md = generateSummary(result);

    expect(md).toContain('# multi-mind Analiz Raporu');
    expect(md).toContain('E-ticaret platformu');
    expect(md).toContain('## Product Manager');
    expect(md).toContain('## CTO / Tech Lead');
    expect(md).toContain('Requirements analysis complete.');
    expect(md).toContain('Tech stack selected: Next.js.');
  });
});

describe('generateAgentReport', () => {
  it('generates individual agent markdown', () => {
    const md = generateAgentReport(mockResults[0]);
    expect(md).toContain('# Product Manager');
    expect(md).toContain('Requirements analysis complete.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/output/markdown.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement markdown generator**

```typescript
// src/output/markdown.ts
import type { AgentResult, PipelineResult } from '../types/index.js';

export function generateSummary(result: PipelineResult): string {
  const lines: string[] = [];
  const date = new Date().toISOString().split('T')[0];

  lines.push(`# multi-mind Analiz Raporu`);
  lines.push('');
  lines.push(`**Tarih:** ${date}`);
  lines.push(`**Brief:** ${result.brief}`);
  lines.push(`**Toplam Sure:** ${(result.totalDurationMs / 1000).toFixed(1)}s`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const agent of result.agents) {
    lines.push(`## ${agent.displayName}`);
    lines.push('');
    lines.push(agent.output);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function generateAgentReport(agent: AgentResult): string {
  const lines: string[] = [];

  lines.push(`# ${agent.displayName}`);
  lines.push('');
  lines.push(`**Ajan:** ${agent.agentName}`);
  lines.push(`**Sure:** ${(agent.durationMs / 1000).toFixed(1)}s`);
  lines.push(`**Zaman:** ${agent.timestamp}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(agent.output);

  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/output/markdown.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/output/markdown.ts tests/output/markdown.test.ts
git commit -m "feat: markdown report generator"
```

---

### Task 9: Output — Structured (YAML/JSON)

**Files:**
- Create: `tests/output/structured.test.ts`
- Create: `src/output/structured.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/output/structured.test.ts
import { describe, it, expect } from 'vitest';
import { generateDecisionsYaml, generateMeta } from '../src/output/structured.js';
import type { AgentResult, PipelineResult } from '../src/types/index.js';

const mockResults: AgentResult[] = [
  {
    agentName: 'product-manager',
    displayName: 'PM',
    output: 'text',
    structured: { requirements: { must_have: ['auth'] } },
    durationMs: 1000,
    timestamp: '2026-04-02T10:00:00Z',
  },
  {
    agentName: 'cto',
    displayName: 'CTO',
    output: 'text',
    structured: { tech_stack: { frontend: 'Next.js' } },
    durationMs: 2000,
    timestamp: '2026-04-02T10:01:00Z',
  },
];

describe('generateDecisionsYaml', () => {
  it('combines all structured outputs into decisions YAML string', () => {
    const yaml = generateDecisionsYaml(mockResults);
    expect(yaml).toContain('product-manager');
    expect(yaml).toContain('must_have');
    expect(yaml).toContain('Next.js');
  });
});

describe('generateMeta', () => {
  it('creates meta.json content', () => {
    const result: PipelineResult = {
      success: true,
      brief: 'Test brief',
      agents: mockResults,
      totalDurationMs: 3000,
    };

    const meta = generateMeta(result);
    expect(meta.version).toBe('0.1.0');
    expect(meta.brief).toBe('Test brief');
    expect(meta.agents_used).toEqual(['product-manager', 'cto']);
    expect(meta.dag_execution.total_duration_ms).toBe(3000);
    expect(meta.dag_execution.agents['product-manager'].duration_ms).toBe(1000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/output/structured.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement structured output**

```typescript
// src/output/structured.ts
import { stringify } from 'yaml';
import type { AgentResult, PipelineResult, RunMeta } from '../types/index.js';

export function generateDecisionsYaml(agents: AgentResult[]): string {
  const decisions: Record<string, unknown> = {};

  for (const agent of agents) {
    if (agent.structured) {
      decisions[agent.agentName] = agent.structured;
    }
  }

  return stringify(decisions);
}

export function generateAgentYaml(agent: AgentResult): string {
  if (!agent.structured) return stringify({ output: agent.output });
  return stringify(agent.structured);
}

export function generateMeta(result: PipelineResult): RunMeta {
  const agentExecution: Record<string, { duration_ms: number }> = {};
  for (const agent of result.agents) {
    agentExecution[agent.agentName] = { duration_ms: agent.durationMs };
  }

  return {
    version: '0.1.0',
    created_at: new Date().toISOString(),
    brief: result.brief,
    agents_used: result.agents.map((a) => a.agentName),
    dag_execution: {
      total_duration_ms: result.totalDurationMs,
      agents: agentExecution,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/output/structured.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/output/structured.ts tests/output/structured.test.ts
git commit -m "feat: structured output (YAML/JSON) generator"
```

---

### Task 10: Output Writer (Disk)

**Files:**
- Create: `src/output/writer.ts`

- [ ] **Step 1: Implement output writer**

```typescript
// src/output/writer.ts
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateSummary, generateAgentReport } from './markdown.js';
import { generateDecisionsYaml, generateAgentYaml, generateMeta } from './structured.js';
import type { PipelineResult } from '../types/index.js';

export function writeOutput(result: PipelineResult, outputDir: string): void {
  const agentsDir = join(outputDir, 'agents');
  mkdirSync(agentsDir, { recursive: true });

  // summary.md
  writeFileSync(join(outputDir, 'summary.md'), generateSummary(result), 'utf-8');

  // decisions.yaml
  writeFileSync(
    join(outputDir, 'decisions.yaml'),
    generateDecisionsYaml(result.agents),
    'utf-8',
  );

  // meta.json
  writeFileSync(
    join(outputDir, 'meta.json'),
    JSON.stringify(generateMeta(result), null, 2),
    'utf-8',
  );

  // Per-agent files
  for (const agent of result.agents) {
    writeFileSync(
      join(agentsDir, `${agent.agentName}.md`),
      generateAgentReport(agent),
      'utf-8',
    );
    writeFileSync(
      join(agentsDir, `${agent.agentName}.yaml`),
      generateAgentYaml(agent),
      'utf-8',
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/output/writer.ts
git commit -m "feat: disk output writer"
```

---

### Task 11: CLI Entry Point + `new` Command

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/commands/new.ts`

- [ ] **Step 1: Create the `new` command**

```typescript
// src/cli/commands/new.ts
import { resolve } from 'path';
import ora from 'ora';
import { loadAgents, validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import type { GlobalOptions } from '../../types/index.js';

export async function newCommand(brief: string, opts: GlobalOptions): Promise<void> {
  const agentsDir = resolve(process.cwd(), 'agents');
  const agents = await loadAgents(agentsDir);

  if (agents.length === 0) {
    console.error('No agents found in agents/ directory.');
    process.exit(1);
  }

  const dagResult = validateDag(agents);
  if (!dagResult.valid) {
    console.error('Invalid agent DAG:');
    dagResult.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const parsed = parseBrief(brief, opts.outputDir);
  const spinner = ora();

  console.log(`\nmulti-mind — ${agents.length} ajan ile analiz baslatiliyor...\n`);

  const result = await runPipeline(agents, brief, {
    model: opts.model,
    filterAgents: opts.agents,
    callbacks: {
      onAgentStart: (agent) => {
        spinner.start(`${agent.display_name} calisiyor...`);
      },
      onAgentComplete: (agentResult) => {
        spinner.succeed(
          `${agentResult.displayName} tamamlandi (${(agentResult.durationMs / 1000).toFixed(1)}s)`,
        );
      },
      onAgentError: (agent, error) => {
        spinner.fail(`${agent.display_name} hata: ${error.message}`);
      },
    },
  });

  writeOutput(result, parsed.outputDir);

  console.log(`\nRapor yazildi: ${parsed.outputDir}/`);
  console.log(`  - summary.md`);
  console.log(`  - decisions.yaml`);
  console.log(`  - meta.json`);
  console.log(`  - agents/ (${result.agents.length} ajan raporu)`);
  console.log(`\nToplam sure: ${(result.totalDurationMs / 1000).toFixed(1)}s`);
}
```

- [ ] **Step 2: Create CLI entry point**

```typescript
// src/cli/index.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { newCommand } from './commands/new.js';
import type { GlobalOptions } from '../types/index.js';

const program = new Command();

program
  .name('multi-mind')
  .description('Multi-agent decision system powered by Claude')
  .version('0.1.0');

program
  .command('new')
  .description('Start a new project analysis with all agents')
  .argument('<brief>', 'Project brief describing what to analyze')
  .option('--verbose', 'Show detailed DAG execution info', false)
  .option('--output-dir <path>', 'Custom output directory', 'output')
  .option('--model <model>', 'Override model for all agents')
  .option('--agents <list>', 'Comma-separated list of agents to run', (val: string) =>
    val.split(',').map((s) => s.trim()),
  )
  .action(async (brief: string, cmdOpts: Record<string, unknown>) => {
    const opts: GlobalOptions = {
      verbose: cmdOpts.verbose as boolean,
      outputDir: cmdOpts.outputDir as string,
      model: cmdOpts.model as string | undefined,
      agents: cmdOpts.agents as string[] | undefined,
    };
    await newCommand(brief, opts);
  });

program.parse();
```

- [ ] **Step 3: Add shebang handling in tsconfig**

Verify the `#!/usr/bin/env node` line is at the top of `src/cli/index.ts`. When building, the shebang will be preserved in `dist/cli/index.js`.

- [ ] **Step 4: Test CLI manually**

Run: `npx tsx src/cli/index.ts new --help`
Expected:
```
Usage: multi-mind new [options] <brief>

Start a new project analysis with all agents

Arguments:
  brief                    Project brief describing what to analyze

Options:
  --verbose                Show detailed DAG execution info (default: false)
  --output-dir <path>      Custom output directory (default: "output")
  --model <model>          Override model for all agents
  --agents <list>          Comma-separated list of agents to run
  -h, --help               display help for command
```

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/cli/commands/new.ts
git commit -m "feat: CLI entry point with 'new' command"
```

---

### Task 12: CLI `agents` Command

**Files:**
- Create: `src/cli/commands/agents.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Implement agents command**

```typescript
// src/cli/commands/agents.ts
import { resolve, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { stringify } from 'yaml';
import { loadAgents } from '../../agents/loader.js';
import type { AgentDefinition } from '../../types/index.js';

export async function agentsListCommand(): Promise<void> {
  const agentsDir = resolve(process.cwd(), 'agents');
  const agents = await loadAgents(agentsDir);

  if (agents.length === 0) {
    console.log('No agents found in agents/ directory.');
    return;
  }

  console.log('\nMevcut Ajanlar:\n');
  console.log('  Ad                  Phase  Bagimliliklar');
  console.log('  ─────────────────── ───── ──────────────');

  for (const agent of agents) {
    const deps = agent.depends_on.length > 0 ? agent.depends_on.join(', ') : '-';
    console.log(
      `  ${agent.display_name.padEnd(20)} ${String(agent.phase).padEnd(6)}${deps}`,
    );
  }

  console.log(`\nToplam: ${agents.length} ajan`);
}

export async function agentsInitCommand(name: string): Promise<void> {
  const customDir = resolve(process.cwd(), 'agents', 'custom');
  mkdirSync(customDir, { recursive: true });

  const template: AgentDefinition = {
    name,
    display_name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
    description: `Custom agent: ${name}`,
    phase: 4,
    depends_on: [],
    input_from: [],
    system_prompt: `Sen bir ${name} uzmanisın.\n\nGorevlerin:\n- ...\n\nCiktini yapisal formatta (YAML code block icinde) ver.`,
  };

  const filePath = join(customDir, `${name}.yaml`);
  writeFileSync(filePath, stringify(template), 'utf-8');
  console.log(`Ajan sablonu olusturuldu: ${filePath}`);
  console.log('Dosyayi duzenleyerek system_prompt ve diger alanlari yaz.');
}
```

- [ ] **Step 2: Register agents command in CLI**

Add to `src/cli/index.ts`, before `program.parse()`:

```typescript
import { agentsListCommand, agentsInitCommand } from './commands/agents.js';

const agentsCmd = program
  .command('agents')
  .description('Manage agents');

agentsCmd
  .command('list')
  .description('List all available agents')
  .action(async () => {
    await agentsListCommand();
  });

agentsCmd
  .command('init')
  .description('Create a new custom agent template')
  .argument('<name>', 'Agent name (e.g. security-analyst)')
  .action(async (name: string) => {
    await agentsInitCommand(name);
  });
```

- [ ] **Step 3: Test manually**

Run: `npx tsx src/cli/index.ts agents list`
Expected: Lists 3 default agents (PM, CTO, Architect)

Run: `npx tsx src/cli/index.ts agents init test-agent`
Expected: Creates `agents/custom/test-agent.yaml`

- [ ] **Step 4: Clean up test agent and commit**

Run: `rm -f agents/custom/test-agent.yaml`

```bash
git add src/cli/commands/agents.ts src/cli/index.ts
git commit -m "feat: agents list and init commands"
```

---

### Task 13: CLI `rerun` Command

**Files:**
- Create: `src/cli/commands/rerun.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Implement rerun command**

```typescript
// src/cli/commands/rerun.ts
import { resolve, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { runAgent } from '../../agents/claude-runner.js';
import { writeFileSync, mkdirSync } from 'fs';
import { generateAgentReport } from '../../output/markdown.js';
import { generateAgentYaml } from '../../output/structured.js';
import type { AgentResult } from '../../types/index.js';

export async function rerunCommand(
  agentName: string,
  opts: { input: string; feedback?: string; model?: string },
): Promise<void> {
  const agentsDir = resolve(process.cwd(), 'agents');
  const agents = await loadAgents(agentsDir);
  const agent = agents.find((a) => a.name === agentName);

  if (!agent) {
    console.error(`Agent "${agentName}" not found. Use 'multi-mind agents list' to see available agents.`);
    process.exit(1);
  }

  const inputDir = resolve(opts.input);
  if (!existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  // Load previous agent outputs for context
  const previousOutputs: Array<{ agentName: string; output: string }> = [];
  for (const dep of agent.input_from) {
    const mdPath = join(inputDir, 'agents', `${dep}.md`);
    if (existsSync(mdPath)) {
      previousOutputs.push({
        agentName: dep,
        output: readFileSync(mdPath, 'utf-8'),
      });
    }
  }

  // Also load the agent's own previous output for context
  const ownMdPath = join(inputDir, 'agents', `${agentName}.md`);
  let ownPreviousOutput: string | undefined;
  if (existsSync(ownMdPath)) {
    ownPreviousOutput = readFileSync(ownMdPath, 'utf-8');
  }

  // Read the original brief from meta.json
  const metaPath = join(inputDir, 'meta.json');
  let brief = '';
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    brief = meta.brief;
  }

  const spinner = ora(`${agent.display_name} yeniden calisiyor...`).start();

  const result = await runAgent(agent, brief, previousOutputs, {
    feedback: opts.feedback,
    model: opts.model,
  });

  spinner.succeed(`${agent.display_name} tamamlandi (${(result.durationMs / 1000).toFixed(1)}s)`);

  // Write updated output
  const agentsOutputDir = join(inputDir, 'agents');
  mkdirSync(agentsOutputDir, { recursive: true });
  writeFileSync(join(agentsOutputDir, `${agentName}.md`), generateAgentReport(result), 'utf-8');
  writeFileSync(join(agentsOutputDir, `${agentName}.yaml`), generateAgentYaml(result), 'utf-8');

  console.log(`\nGuncellendi: ${agentsOutputDir}/${agentName}.md`);
}
```

- [ ] **Step 2: Register rerun command in CLI**

Add to `src/cli/index.ts`, before `program.parse()`:

```typescript
import { rerunCommand } from './commands/rerun.js';

program
  .command('rerun')
  .description('Re-run a single agent with optional feedback')
  .argument('<agent>', 'Agent name to re-run')
  .requiredOption('--input <path>', 'Path to previous output directory')
  .option('--feedback <text>', 'Feedback to include in re-run')
  .option('--model <model>', 'Override model for this agent')
  .action(async (agent: string, cmdOpts: Record<string, unknown>) => {
    await rerunCommand(agent, {
      input: cmdOpts.input as string,
      feedback: cmdOpts.feedback as string | undefined,
      model: cmdOpts.model as string | undefined,
    });
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/rerun.ts src/cli/index.ts
git commit -m "feat: rerun command for single agent re-execution with feedback"
```

---

### Task 14: CLI `debate` Command

**Files:**
- Create: `src/cli/commands/debate.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Implement debate command**

```typescript
// src/cli/commands/debate.ts
import { resolve } from 'path';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { runAgent } from '../../agents/claude-runner.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import type { AgentResult, PipelineResult } from '../../types/index.js';

export async function debateCommand(
  topic: string,
  opts: { agents?: string; outputDir: string; model?: string },
): Promise<void> {
  const agentsDir = resolve(process.cwd(), 'agents');
  const allAgents = await loadAgents(agentsDir);

  // Pick 2 agents for debate
  const agentNames = opts.agents
    ? opts.agents.split(',').map((s) => s.trim())
    : ['cto', 'architect'];

  if (agentNames.length !== 2) {
    console.error('Debate requires exactly 2 agents. Use --agents agent1,agent2');
    process.exit(1);
  }

  const debaters = agentNames.map((name) => {
    const agent = allAgents.find((a) => a.name === name);
    if (!agent) {
      console.error(`Agent "${name}" not found.`);
      process.exit(1);
    }
    return agent!;
  });

  const spinner = ora();
  const startTime = Date.now();
  const results: AgentResult[] = [];

  // First agent argues PRO
  spinner.start(`${debaters[0].display_name} (PRO taraf) calisiyor...`);
  const proResult = await runAgent(
    {
      ...debaters[0],
      system_prompt: `${debaters[0].system_prompt}\n\nSu konuda PRO (lehte) pozisyonunda argumanlar sun: "${topic}"\nGuclu gerekcelerin ve somut orneklerle destekle.`,
    },
    topic,
    [],
    { model: opts.model },
  );
  results.push(proResult);
  spinner.succeed(`${debaters[0].display_name} (PRO) tamamlandi`);

  // Second agent argues CON
  spinner.start(`${debaters[1].display_name} (CON taraf) calisiyor...`);
  const conResult = await runAgent(
    {
      ...debaters[1],
      system_prompt: `${debaters[1].system_prompt}\n\nSu konuda CON (aleyhte) pozisyonunda argumanlar sun: "${topic}"\nKarsi tarafin argumanlari:\n${proResult.output}\n\nBunlara karsi argumanlar gelistir.`,
    },
    topic,
    [{ agentName: proResult.agentName, output: proResult.output }],
    { model: opts.model },
  );
  results.push(conResult);
  spinner.succeed(`${debaters[1].display_name} (CON) tamamlandi`);

  const pipelineResult: PipelineResult = {
    success: true,
    brief: `Debate: ${topic}`,
    agents: results,
    totalDurationMs: Date.now() - startTime,
  };

  const parsed = parseBrief(`debate-${topic}`, opts.outputDir);
  writeOutput(pipelineResult, parsed.outputDir);

  console.log(`\n--- DEBATE: ${topic} ---\n`);
  console.log(`PRO (${debaters[0].display_name}):`);
  console.log(proResult.output.slice(0, 500) + '...\n');
  console.log(`CON (${debaters[1].display_name}):`);
  console.log(conResult.output.slice(0, 500) + '...\n');
  console.log(`Detayli rapor: ${parsed.outputDir}/`);
}
```

- [ ] **Step 2: Register debate command in CLI**

Add to `src/cli/index.ts`, before `program.parse()`:

```typescript
import { debateCommand } from './commands/debate.js';

program
  .command('debate')
  .description('Two agents debate opposing positions on a topic')
  .argument('<topic>', 'Topic to debate')
  .option('--agents <list>', 'Two comma-separated agent names (default: cto,architect)')
  .option('--output-dir <path>', 'Custom output directory', 'output')
  .option('--model <model>', 'Override model for all agents')
  .action(async (topic: string, cmdOpts: Record<string, unknown>) => {
    await debateCommand(topic, {
      agents: cmdOpts.agents as string | undefined,
      outputDir: cmdOpts.outputDir as string,
      model: cmdOpts.model as string | undefined,
    });
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/debate.ts src/cli/index.ts
git commit -m "feat: debate command for opposing agent arguments"
```

---

### Task 15: CLI `decide` Command

**Files:**
- Create: `src/cli/commands/decide.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Implement decide command**

```typescript
// src/cli/commands/decide.ts
import { resolve } from 'path';
import ora from 'ora';
import { loadAgents } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import type { GlobalOptions } from '../../types/index.js';

export async function decideCommand(question: string, opts: GlobalOptions): Promise<void> {
  const agentsDir = resolve(process.cwd(), 'agents');
  const agents = await loadAgents(agentsDir);

  if (agents.length === 0) {
    console.error('No agents found in agents/ directory.');
    process.exit(1);
  }

  // For decide mode, override all agents to run in parallel (phase 1, no deps)
  const parallelAgents = agents.map((a) => ({
    ...a,
    phase: 1,
    depends_on: [] as string[],
    input_from: [] as string[],
    system_prompt: `${a.system_prompt}\n\nSu soruya kendi uzmanlik alanin perspektifinden cevap ver:\n"${question}"\n\nNet bir pozisyon al ve gerekcelendir.`,
  }));

  const parsed = parseBrief(`decide-${question}`, opts.outputDir);
  const spinner = ora();

  console.log(`\nmulti-mind — ${parallelAgents.length} ajan ile karar aliniyor...\n`);
  console.log(`Soru: "${question}"\n`);

  const result = await runPipeline(parallelAgents, question, {
    model: opts.model,
    filterAgents: opts.agents,
    callbacks: {
      onAgentStart: (agent) => {
        spinner.start(`${agent.display_name} dusunuyor...`);
      },
      onAgentComplete: (agentResult) => {
        spinner.succeed(
          `${agentResult.displayName} tamamlandi (${(agentResult.durationMs / 1000).toFixed(1)}s)`,
        );
      },
      onAgentError: (agent, error) => {
        spinner.fail(`${agent.display_name} hata: ${error.message}`);
      },
    },
  });

  writeOutput(result, parsed.outputDir);

  console.log(`\nDetayli rapor: ${parsed.outputDir}/`);
}
```

- [ ] **Step 2: Register decide command in CLI**

Add to `src/cli/index.ts`, before `program.parse()`:

```typescript
import { decideCommand } from './commands/decide.js';

program
  .command('decide')
  .description('All agents evaluate a specific question')
  .argument('<question>', 'Question to decide on')
  .option('--verbose', 'Show detailed execution info', false)
  .option('--output-dir <path>', 'Custom output directory', 'output')
  .option('--model <model>', 'Override model for all agents')
  .option('--agents <list>', 'Comma-separated list of agents to consult', (val: string) =>
    val.split(',').map((s) => s.trim()),
  )
  .action(async (question: string, cmdOpts: Record<string, unknown>) => {
    const opts: GlobalOptions = {
      verbose: cmdOpts.verbose as boolean,
      outputDir: cmdOpts.outputDir as string,
      model: cmdOpts.model as string | undefined,
      agents: cmdOpts.agents as string[] | undefined,
    };
    await decideCommand(question, opts);
  });
```

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/decide.ts src/cli/index.ts
git commit -m "feat: decide command for multi-agent question evaluation"
```

---

### Task 16: CLI `analyze` Command

**Files:**
- Create: `src/context/project-loader.ts`
- Create: `src/cli/commands/analyze.ts`
- Modify: `src/cli/index.ts`

- [ ] **Step 1: Implement project loader**

```typescript
// src/context/project-loader.ts
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

export interface ProjectContext {
  name: string;
  hasPackageJson: boolean;
  techStack: string[];
  fileCount: number;
  structure: string;
}

export function loadProjectContext(projectPath: string): ProjectContext {
  const name = basename(projectPath);
  const techStack: string[] = [];
  let fileCount = 0;

  // Detect tech stack from config files
  const indicators: Record<string, string> = {
    'package.json': 'Node.js',
    'tsconfig.json': 'TypeScript',
    'next.config.js': 'Next.js',
    'next.config.ts': 'Next.js',
    'vite.config.ts': 'Vite',
    'tailwind.config.js': 'Tailwind CSS',
    'tailwind.config.ts': 'Tailwind CSS',
    'prisma/schema.prisma': 'Prisma',
    'docker-compose.yml': 'Docker',
    'Dockerfile': 'Docker',
    'requirements.txt': 'Python',
    'go.mod': 'Go',
    'Cargo.toml': 'Rust',
  };

  for (const [file, tech] of Object.entries(indicators)) {
    if (existsSync(join(projectPath, file))) {
      techStack.push(tech);
    }
  }

  // Read package.json for more details
  const hasPackageJson = existsSync(join(projectPath, 'package.json'));
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(readFileSync(join(projectPath, 'package.json'), 'utf-8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.react) techStack.push('React');
      if (allDeps.vue) techStack.push('Vue');
      if (allDeps.express) techStack.push('Express');
    } catch {}
  }

  // Count files (shallow, skip node_modules and .git)
  const structure = buildStructure(projectPath, 2);
  fileCount = countFiles(projectPath);

  return {
    name,
    hasPackageJson,
    techStack: [...new Set(techStack)],
    fileCount,
    structure,
  };
}

function buildStructure(dir: string, maxDepth: number, depth = 0): string {
  if (depth >= maxDepth) return '';

  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !['node_modules', '.git', 'dist', '.next'].includes(e.name))
    .slice(0, 20);

  const lines: string[] = [];
  for (const entry of entries) {
    const prefix = '  '.repeat(depth);
    if (entry.isDirectory()) {
      lines.push(`${prefix}${entry.name}/`);
      lines.push(buildStructure(join(dir, entry.name), maxDepth, depth + 1));
    } else {
      lines.push(`${prefix}${entry.name}`);
    }
  }
  return lines.filter(Boolean).join('\n');
}

function countFiles(dir: string): number {
  let count = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      if (entry.isFile()) count++;
      else if (entry.isDirectory()) count += countFiles(join(dir, entry.name));
    }
  } catch {}
  return count;
}

export function projectContextToBrief(ctx: ProjectContext): string {
  const parts = [`Proje: ${ctx.name}`];
  if (ctx.techStack.length > 0) {
    parts.push(`Tech Stack: ${ctx.techStack.join(', ')}`);
  }
  parts.push(`Dosya Sayisi: ${ctx.fileCount}`);
  parts.push(`\nDizin Yapisi:\n${ctx.structure}`);
  return parts.join('\n');
}
```

- [ ] **Step 2: Implement analyze command**

```typescript
// src/cli/commands/analyze.ts
import { resolve } from 'path';
import { existsSync } from 'fs';
import ora from 'ora';
import { loadAgents, validateDag } from '../../agents/loader.js';
import { runPipeline } from '../../orchestrator/pipeline.js';
import { loadProjectContext, projectContextToBrief } from '../../context/project-loader.js';
import { parseBrief } from '../../context/brief-parser.js';
import { writeOutput } from '../../output/writer.js';
import type { GlobalOptions } from '../../types/index.js';

export async function analyzeCommand(projectPath: string, opts: GlobalOptions): Promise<void> {
  const fullPath = resolve(projectPath);

  if (!existsSync(fullPath)) {
    console.error(`Project path not found: ${fullPath}`);
    process.exit(1);
  }

  const agentsDir = resolve(process.cwd(), 'agents');
  const agents = await loadAgents(agentsDir);
  const dagResult = validateDag(agents);

  if (!dagResult.valid) {
    console.error('Invalid agent DAG:');
    dagResult.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const spinner = ora('Proje analiz ediliyor...').start();
  const ctx = loadProjectContext(fullPath);
  spinner.succeed(`Proje yuklendi: ${ctx.name} (${ctx.techStack.join(', ')})`);

  const brief = projectContextToBrief(ctx);
  const parsed = parseBrief(`analyze-${ctx.name}`, opts.outputDir);

  console.log(`\nmulti-mind — ${agents.length} ajan ile proje analizi...\n`);

  const result = await runPipeline(agents, brief, {
    model: opts.model,
    filterAgents: opts.agents,
    callbacks: {
      onAgentStart: (agent) => {
        spinner.start(`${agent.display_name} calisiyor...`);
      },
      onAgentComplete: (agentResult) => {
        spinner.succeed(
          `${agentResult.displayName} tamamlandi (${(agentResult.durationMs / 1000).toFixed(1)}s)`,
        );
      },
      onAgentError: (agent, error) => {
        spinner.fail(`${agent.display_name} hata: ${error.message}`);
      },
    },
  });

  writeOutput(result, parsed.outputDir);
  console.log(`\nRapor: ${parsed.outputDir}/`);
}
```

- [ ] **Step 3: Register analyze command in CLI**

Add to `src/cli/index.ts`, before `program.parse()`:

```typescript
import { analyzeCommand } from './commands/analyze.js';

program
  .command('analyze')
  .description('Analyze an existing project codebase')
  .argument('<path>', 'Path to the project directory')
  .option('--verbose', 'Show detailed execution info', false)
  .option('--output-dir <path>', 'Custom output directory', 'output')
  .option('--model <model>', 'Override model for all agents')
  .option('--agents <list>', 'Comma-separated list of agents', (val: string) =>
    val.split(',').map((s) => s.trim()),
  )
  .action(async (path: string, cmdOpts: Record<string, unknown>) => {
    const opts: GlobalOptions = {
      verbose: cmdOpts.verbose as boolean,
      outputDir: cmdOpts.outputDir as string,
      model: cmdOpts.model as string | undefined,
      agents: cmdOpts.agents as string[] | undefined,
    };
    await analyzeCommand(path, opts);
  });
```

- [ ] **Step 4: Commit**

```bash
git add src/context/project-loader.ts src/cli/commands/analyze.ts src/cli/index.ts
git commit -m "feat: analyze command with project context loader"
```

---

### Task 17: Run All Tests + Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Build TypeScript**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Verify CLI help**

Run: `npx tsx src/cli/index.ts --help`
Expected: Shows all commands (new, analyze, decide, rerun, debate, agents)

- [ ] **Step 4: Verify agents list**

Run: `npx tsx src/cli/index.ts agents list`
Expected: Shows 3 agents with phases and dependencies

- [ ] **Step 5: Build for distribution**

Run: `npx tsc`
Expected: `dist/` directory created with compiled JS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: verify build and tests pass"
```

---

### Task 18: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# multi-mind

Open source multi-agent decision system powered by Claude.

A "virtual advisory board" of AI agents that analyze your software projects and provide professional technical analysis reports.

## Prerequisites

- Node.js >= 18
- [Claude Code Max](https://claude.ai) subscription with `claude` CLI installed and authenticated

## Quick Start

```bash
npx multi-mind new "E-commerce platform with Next.js, multi-tenant, Turkish market"
```

## Commands

| Command | Description |
|---------|-------------|
| `multi-mind new <brief>` | Start a new project analysis |
| `multi-mind analyze <path>` | Analyze an existing codebase |
| `multi-mind decide <question>` | All agents evaluate a question |
| `multi-mind rerun <agent>` | Re-run a single agent with feedback |
| `multi-mind debate <topic>` | Two agents debate opposing positions |
| `multi-mind agents list` | List available agents |
| `multi-mind agents init <name>` | Create a custom agent template |

## Default Agents

| Agent | Role |
|-------|------|
| Product Manager | Requirements, user stories, MVP scope |
| CTO / Tech Lead | Tech stack, feasibility, cost analysis |
| Software Architect | System architecture, modules, data flow |

## Custom Agents

Create your own agents with YAML:

```bash
multi-mind agents init security-analyst
# Edit agents/custom/security-analyst.yaml
```

## Output

Reports are saved to `output/<date>-<slug>/`:

- `summary.md` — Combined analysis report
- `decisions.yaml` — Structured decisions
- `meta.json` — Execution metadata
- `agents/` — Individual agent reports (MD + YAML)

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage guide"
```
