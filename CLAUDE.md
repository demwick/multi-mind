# CLAUDE.md

## Project Overview

multi-mind is an open-source CLI tool that orchestrates multiple AI agents to produce professional technical analysis reports. Each agent is a specialized role (PM, CTO, Architect, DevOps Engineer, QA Engineer, Security Analyst) that runs via `claude -p` CLI.

## Tech Stack

- TypeScript (ESM, strict mode)
- Node.js >= 18
- Commander.js (CLI)
- yaml (YAML parsing)
- ora (terminal spinners)
- vitest (testing)

## Architecture

```
src/cli/index.ts                   Entry point, registers all commands
src/cli/commands/<name>.ts         One file per CLI command
src/cli/interactive.ts             Interactive brief collection (TTY prompt)
src/config/loader.ts               Loads .multimindrc.yaml from cwd upward
src/config/merge.ts                Merges file config with CLI flags
src/agents/loader.ts               Reads and validates YAML agent definitions
src/agents/claude-runner.ts        Builds prompts and calls `claude -p` via execFile
src/agents/validator.ts            Validates agent output against output_schema
src/orchestrator/pipeline.ts       Runs agents in DAG order (phase-based, parallel within phase)
src/orchestrator/multi-round.ts    Wraps pipeline for multi-round review loops
src/orchestrator/synthesizer.ts    Calls Claude to produce an executive summary
src/context/brief-parser.ts        Parses brief string, generates output dir slug
src/context/project-loader.ts      Scans a project directory for analyze command
src/output/writer.ts               Writes summary.md, decisions.yaml, meta.json, agents/
src/output/markdown.ts             Generates Markdown report content
src/output/structured.ts           Generates YAML/JSON structured output files
src/types/index.ts                 Shared TypeScript types
```

## Key Files

| File | Purpose |
|------|---------|
| `src/cli/index.ts` | Registers all Commander.js commands and sets CLI name/version |
| `src/cli/commands/new.ts` | `multi-mind new` — runs full pipeline, supports `--rounds` |
| `src/cli/commands/analyze.ts` | `multi-mind analyze <path>` — scans project dir and runs pipeline |
| `src/cli/commands/decide.ts` | `multi-mind decide <question>` — all agents evaluate in parallel |
| `src/cli/commands/rerun.ts` | `multi-mind rerun <agent>` — re-runs a single agent with feedback |
| `src/cli/commands/debate.ts` | `multi-mind debate <topic>` — two agents take opposing positions |
| `src/cli/commands/agents.ts` | `multi-mind agents list/init` — list agents or scaffold a custom one |
| `src/cli/commands/init.ts` | `multi-mind init` — project initialization |
| `src/config/loader.ts` | Walks directories upward looking for `.multimindrc.yaml` |
| `src/agents/claude-runner.ts` | `buildPrompt()` and `runAgent()` — core Claude integration |
| `src/orchestrator/pipeline.ts` | `runPipeline()` — phase-based DAG execution with parallel phases |
| `src/orchestrator/multi-round.ts` | `runMultiRound()` — round 1 is normal pipeline; rounds 2+ inject cross-agent review |
| `agents/*.yaml` | Built-in agent definitions |
| `agents/custom/` | User-created custom agents (gitignored by convention) |

## Commands

| Command | Description |
|---------|-------------|
| `multi-mind new <brief>` | Run the full multi-agent pipeline on a brief |
| `multi-mind analyze <path>` | Analyze an existing project directory |
| `multi-mind decide <question>` | All agents evaluate a question in parallel |
| `multi-mind rerun <agent>` | Re-run a single agent with feedback |
| `multi-mind debate <topic>` | Two agents debate opposing positions |
| `multi-mind agents list` | List all available agents |
| `multi-mind agents init <name>` | Create a custom agent YAML template |
| `multi-mind init` | Initialize a new multi-mind project |

### Common Options

```
-v, --verbose          Show detailed execution info and debug logs
-o, --output-dir <dir> Custom output directory (default: output/)
-m, --model <model>    Override model for all agents
-a, --agents <list>    Comma-separated list of agent names to run
-r, --rounds <number>  Number of analysis rounds (agents review each other)
```

## Testing

- Run: `npm test`
- Watch mode: `npm run test:watch`
- Framework: vitest
- Tests in `tests/` mirror `src/` structure
- Mock `claude-runner` for pipeline tests

## Development

- Run in dev: `npx tsx src/cli/index.ts <command>`
  - Or via package script: `npm run dev -- new "test brief"`
- Build: `npm run build`
- Type check: `npx tsc --noEmit`

## Conventions

- All imports use `.js` extension (ESM)
- Agent definitions are YAML files in `agents/`
- Custom agents go in `agents/custom/`
- Output goes to `output/<date>-<slug>/`
- Turkish language in agent prompts and user-facing messages
- English in code, variable names, and comments

## Adding a New Agent

1. Create `agents/<name>.yaml` or `agents/custom/<name>.yaml`
2. Define the required fields:
   ```yaml
   name: my-agent          # kebab-case, unique
   display_name: "My Agent"
   description: "What this agent does"
   phase: 5                # execution order; agents in same phase run in parallel
   depends_on:
     - architect           # DAG dependencies (must be lower phase)
   input_from:
     - architect           # agents whose output is passed as context
   system_prompt: |
     You are a ...
   ```
3. Set `depends_on` to declare DAG ordering; `input_from` controls what previous output is injected into the prompt.
4. Optionally add `output_schema` to validate structured YAML output.
5. Run `multi-mind agents list` to verify the agent is discovered.

## Adding a New CLI Command

1. Create `src/cli/commands/<name>.ts`
2. Export a `make<Name>Command(): Command` function using Commander.js
3. Register it in `src/cli/index.ts`:
   ```ts
   import { makeMyCommand } from './commands/my-command.js';
   program.addCommand(makeMyCommand());
   ```

## Config File (`.multimindrc.yaml`)

Supported fields (all optional):

```yaml
model: claude-opus-4-5
output_dir: reports
agents_dir: my-agents
agents:
  - product-manager
  - cto
```

The config loader walks from `cwd` up to `$HOME` looking for `.multimindrc.yaml` or `.multimindrc.yml`. CLI flags override config file values.
