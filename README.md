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
| `multi-mind decide <question>` | All agents evaluate a question in parallel |
| `multi-mind rerun <agent>` | Re-run a single agent with feedback |
| `multi-mind debate <topic>` | Two agents debate opposing positions |
| `multi-mind agents list` | List available agents |
| `multi-mind agents init <name>` | Create a custom agent template |

### Options

```bash
--verbose          Show detailed execution info
--output-dir       Custom output directory (default: output/)
--model            Override model for all agents
--agents           Comma-separated list of agents to run
```

## Default Agents

| Agent | Phase | Role |
|-------|-------|------|
| Product Manager | 1 | Requirements, user stories, MVP scope |
| CTO / Tech Lead | 2 | Tech stack, feasibility, cost analysis |
| Software Architect | 3 | System architecture, modules, data flow |

Agents run in dependency order: PM -> CTO -> Architect. Each agent receives the output of its predecessors.

## Custom Agents

Create your own agents with YAML:

```bash
multi-mind agents init security-analyst
# Edit agents/custom/security-analyst.yaml
```

Agent YAML format:

```yaml
name: security-analyst
display_name: "Security Analyst"
description: "Security assessment and threat modeling"
phase: 4
depends_on:
  - architect
input_from:
  - architect
system_prompt: |
  You are a security expert...
```

## Output

Reports are saved to `output/<date>-<slug>/`:

```
output/2026-04-02-e-commerce-platform/
├── summary.md              # Combined analysis report
├── decisions.yaml          # Structured decisions (all agents)
├── meta.json               # Execution metadata
└── agents/
    ├── product-manager.md  # Individual agent reports
    ├── product-manager.yaml
    ├── cto.md
    ├── cto.yaml
    ├── architect.md
    └── architect.yaml
```

## How It Works

1. You provide a brief describing your project or question
2. The CLI loads agent definitions from YAML files
3. Agents execute in DAG order via `claude -p` (your Claude Code Max subscription)
4. Each agent receives the brief + outputs from its dependencies
5. Results are written as Markdown + YAML reports

## Development

```bash
npm install
npm test            # Run tests
npm run dev -- new "test brief"  # Run in dev mode
npm run build       # Build for distribution
```

## License

MIT
