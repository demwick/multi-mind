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
| DevOps Engineer | 4 | Infrastructure, CI/CD, deployment strategy |
| QA Engineer | 4 | Test strategy, quality gates, edge cases |
| Security Analyst | 4 | Threat modeling, security requirements |

Agents run in dependency order: PM → CTO → Architect → (DevOps, QA, Security in parallel). Each agent receives the output of its predecessors.

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

## Configuration

Create a `.multimindrc.yaml` file in your project root (or any parent directory up to `$HOME`) to set defaults:

```yaml
model: claude-opus-4-5      # Claude model for all agents
output_dir: reports         # Output directory (default: output/)
agents_dir: my-agents       # Custom agents directory
agents:                     # Restrict which agents run
  - product-manager
  - cto
  - architect
```

CLI flags always take precedence over the config file. The loader searches from the current directory upward, so a single `~/.multimindrc.yaml` applies globally.

## Multi-Round Analysis

Use `--rounds` to have agents review and challenge each other's findings:

```bash
multi-mind new "My project brief" --rounds 3
```

- **Round 1:** Each agent runs the normal pipeline in phase order.
- **Rounds 2+:** Every agent receives all previous-round outputs and is instructed to identify disagreements, revise its own recommendations, and note consensus points.

Each agent's final output in the last round includes sections for "Consensus Points", "Objections", and "Revised Recommendations". More rounds produce more refined, cross-validated analysis at the cost of additional Claude API calls.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, development workflow, and guidelines for adding new agents or commands.

## License

MIT
