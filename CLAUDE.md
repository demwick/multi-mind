# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

multi-mind is an open-source CLI tool that orchestrates multiple AI agents to produce professional technical analysis reports. Each agent is a specialized role (PM, CTO, Architect, DevOps Engineer, QA Engineer, Security Analyst) that runs via `claude -p` CLI. Requires an authenticated `claude` CLI (Claude Code Max subscription) on the system PATH.

## Tech Stack

- TypeScript (ESM, strict mode, target ES2022)
- Node.js >= 18
- Commander.js (CLI), yaml (YAML parsing), ora (terminal spinners)
- vitest (testing)

## Build & Test Commands

```bash
npm run build              # tsc → dist/
npm test                   # vitest run (all tests)
npm run test:watch         # vitest in watch mode
npx vitest run tests/orchestrator/pipeline.test.ts  # single test file
npx tsc --noEmit           # type check only
npm run dev -- new "brief" # run in dev via tsx
npx tsx src/cli/index.ts <command>  # direct dev execution
```

## Architecture

```
src/cli/index.ts              Entry point, registers all Commander.js commands
src/cli/commands/<name>.ts    One file per CLI command (exports make<Name>Command())
src/cli/interactive.ts        Interactive brief collection (TTY prompt)
src/config/                   Config loader (.multimindrc.yaml) + CLI flag merging
src/agents/                   Agent loading, Claude execution, output validation
src/orchestrator/             Pipeline (DAG), multi-round review, synthesizer
src/context/                  Brief parsing, project directory scanning
src/output/                   Report writing (Markdown, YAML, JSON)
src/types/index.ts            All shared TypeScript interfaces
```

### Core Execution Flow

1. **CLI Command** (`src/cli/commands/`) parses args, loads config, loads agent YAML definitions
2. **Pipeline** (`src/orchestrator/pipeline.ts`) groups agents by `phase` number, runs phases sequentially, agents within same phase run in parallel via `Promise.all`
3. **Claude Runner** (`src/agents/claude-runner.ts`) builds a prompt from system_prompt + previous agent outputs + brief, then spawns `claude -p - --output-format text` and pipes the prompt via **stdin** (not CLI args, to avoid OS arg length limits). 10-minute timeout per agent.
4. **Output Parsing** extracts YAML from ` ```yaml ``` ` code blocks in Claude's response via regex
5. **Validation** (`src/agents/validator.ts`) checks structured output against agent's `output_schema` if defined
6. **Multi-round** (`src/orchestrator/multi-round.ts`) — round 1 is normal pipeline; rounds 2+ inject all prior outputs so agents cross-review each other
7. **Writer** (`src/output/writer.ts`) saves summary.md, decisions.yaml, meta.json, and per-agent reports to `output/<date>-<slug>/`

### DAG Dependency Model

Agents define `phase` (execution order), `depends_on` (DAG edges), and `input_from` (which agent outputs get injected into the prompt). Agents in the same phase run in parallel. Default pipeline: PM(1) → CTO(2) → Architect(3) → DevOps+QA+Security(4).

## Conventions

- All imports use `.js` extension (ESM requirement)
- Agent definitions are YAML files in `agents/`; custom agents in `agents/custom/`
- Output goes to `output/<date>-<slug>/`
- Turkish language in agent prompts and user-facing messages
- English in code, variable names, and comments
- Tests in `tests/` mirror `src/` structure; mock `claude-runner` for pipeline tests (see `vi.mock` pattern in `tests/orchestrator/pipeline.test.ts`)

## Adding a New Agent

1. Create `agents/<name>.yaml` or `agents/custom/<name>.yaml`
2. Required fields: `name` (kebab-case), `display_name`, `description`, `phase`, `depends_on`, `input_from`, `system_prompt`
3. Optional: `output_schema` (YAML schema for validation), `model`, `temperature`
4. `depends_on` declares DAG ordering; `input_from` controls what previous output is injected into the prompt
5. Verify with `multi-mind agents list`

## Adding a New CLI Command

1. Create `src/cli/commands/<name>.ts`, export `make<Name>Command(): Command`
2. Register in `src/cli/index.ts` via `program.addCommand()`

## Config File (`.multimindrc.yaml`)

Loader walks from cwd up to `$HOME` looking for `.multimindrc.yaml` or `.multimindrc.yml`. CLI flags override config values. Supported: `model`, `output_dir`, `agents_dir`, `agents` (list).
