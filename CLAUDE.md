# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

multi-mind is an open-source CLI tool that orchestrates multiple AI agents to produce professional technical analysis reports. Each agent is a specialized role (PM, CTO, Architect, DevOps Engineer, QA Engineer, Security Analyst). Agents run via either the authenticated `claude -p` CLI (default, Claude Code Max) or the Vercel AI SDK with an API key (anthropic/openai/google).

## Tech Stack

- TypeScript (ESM, strict mode, target ES2022)
- Node.js >= 18
- Commander.js (CLI), yaml (YAML parsing), ora (terminal spinners)
- Vercel AI SDK (`ai` + `@ai-sdk/{anthropic,openai,google}`) — optional API-key backend alternative to the `claude` CLI
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
src/agents/loader.ts          Agent YAML → AgentDefinition (inlines system_prompt_file)
src/agents/claude-runner.ts   CLI backend + runner dispatch (CLI vs SDK)
src/agents/sdk-runner.ts      Vercel AI SDK backend (anthropic/openai/google)
src/agents/validator.ts       Structured output schema validation
src/orchestrator/             Pipeline (DAG), multi-round review, synthesizer
src/context/                  Brief parsing, project directory scanning
src/output/                   Report writing (Markdown, YAML, JSON)
src/types/index.ts            All shared TypeScript interfaces
agents/prompts/               External .md files referenced by system_prompt_file
```

### Core Execution Flow

1. **CLI Command** (`src/cli/commands/`) parses args, loads config, loads agent YAML definitions
2. **Pipeline** (`src/orchestrator/pipeline.ts`) groups agents by `phase` number, runs phases sequentially, agents within same phase run in parallel via `Promise.all`
3. **Agent Runner** (`src/agents/claude-runner.ts`) builds a prompt from system_prompt + previous agent outputs + brief, then dispatches to one of two backends:
   - **SDK path** (`sdk-runner.ts`): if `providerConfig` is present (via `.multimindrc.yaml` or CLI), uses Vercel AI SDK with `@ai-sdk/anthropic | openai | google`. API-key based, no CLI dependency.
   - **CLI path** (default): spawns `claude -p - --output-format text` and pipes the prompt via **stdin** (not argv, to avoid OS arg length limits). Requires an authenticated `claude` CLI. 10-minute timeout per agent.
   - Both paths honor `RetryConfig` (exponential backoff via `retry.max_retries` / `retry.base_delay_ms`).
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
2. Required fields: `name` (kebab-case), `display_name`, `description`, `phase`, `depends_on`, `input_from`, and either `system_prompt` (inline) OR `system_prompt_file` (path to `.md`, e.g. `prompts/<name>.md` — loader reads and inlines it)
3. Optional: `output_schema` (YAML schema for validation), `model`, `temperature`
4. `depends_on` declares DAG ordering; `input_from` controls what previous output is injected into the prompt
5. Long prompts belong in `agents/prompts/` via `system_prompt_file` — keeps YAML readable
6. Verify with `multi-mind agents list`

## Adding a New CLI Command

1. Create `src/cli/commands/<name>.ts`, export `make<Name>Command(): Command`
2. Register in `src/cli/index.ts` via `program.addCommand()`

## Config File (`.multimindrc.yaml`)

Loader walks from cwd up to `$HOME` looking for `.multimindrc.yaml` or `.multimindrc.yml`. CLI flags always override config values.

Supported fields:

```yaml
model: claude-sonnet-4.6     # default model for all agents
output_dir: output           # report destination
agents_dir: agents           # where agent YAMLs live
agents:                      # restrict which agents run
  - product-manager
  - cto
language: tr                 # agent output language
provider: anthropic          # anthropic | openai | google → switches to SDK runner
api_key: sk-...              # required when provider is set
retry:
  max_retries: 3
  base_delay_ms: 1000
profiles:                    # multi-profile: layered config dirs
  - name: work
    config_dir: ~/.multimind/work
```

Setting `provider` + `api_key` switches the pipeline from the `claude` CLI to the Vercel AI SDK backend — removes the `claude` CLI dependency entirely.
