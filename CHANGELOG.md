# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-12

### Added
- Multi-agent orchestration pipeline with DAG-based execution
- Built-in agents: PM, CTO, Architect, DevOps, QA, Security Analyst
- CLI commands: `new`, `analyze`, `debate`, `decide`, `rerun`, `agents list`, `init`
- Multi-round analysis — agents review and challenge each other across rounds
- AI-powered executive summary synthesizer
- Interactive brief collection (TTY prompt)
- `.multimindrc.yaml` config file support with directory walk-up resolution
- `system_prompt_file` support — move agent prompts to separate `.md` files
- `output_schema` validation with warnings
- Error tolerance — partial reports on agent failure
- Retry logic and multi-profile support
- Improved progress display for parallel agent execution
- Verbose mode with detailed execution info
- Stdin pipe for prompt delivery (avoids OS argument length limits)
- 10-minute timeout per agent, 5-minute timeout for synthesizer
- Output formats: Markdown summary, YAML decisions, JSON metadata, per-agent reports

### Changed
- Converted all internal prompts to English for token efficiency with auto-detected output language
