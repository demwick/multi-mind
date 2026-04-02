# Contributing to multi-mind

## Getting Started

1. Fork and clone the repo
2. `npm install`
3. `npm test` to verify setup

## Development

Run the CLI locally without building:

```bash
# Using the dev script
npm run dev -- new "My product brief"

# Or directly with tsx
npx tsx src/cli/index.ts new "My product brief"
npx tsx src/cli/index.ts agents list
```

Type check without emitting:

```bash
npx tsc --noEmit
```

Build the distributable:

```bash
npm run build
```

## Adding Agents

The fastest way to create a custom agent:

```bash
multi-mind agents init my-agent
# Edit agents/custom/my-agent.yaml
```

Agent YAML structure:

```yaml
name: my-agent
display_name: "My Agent"
description: "One-line description of the agent's role"
phase: 5                    # Integer; agents in the same phase run in parallel
depends_on:
  - architect               # Must be an agent with a lower phase number
input_from:
  - architect               # Outputs from these agents are injected into the prompt
system_prompt: |
  You are a ...
output_schema:              # Optional: validates the YAML block in the agent's output
  key:
    type: string
```

Place built-in agents in `agents/` and personal/project-specific agents in `agents/custom/`. The loader picks up both locations automatically.

## Pull Requests

- One feature per PR
- Include tests for new functionality — test files live in `tests/` and mirror `src/` structure
- Run `npm test` and `npx tsc --noEmit` before submitting
- Follow existing code style: TypeScript strict mode, ESM imports with `.js` extension
- Keep agent prompts in Turkish; keep code, variable names, and comments in English

## Reporting Issues

Open an issue at <https://github.com/demirel/multi-mind/issues> with:

- The command you ran
- The error output
- Your Node.js version (`node --version`)
- Your Claude CLI version (`claude --version`)
