import type { MultiMindConfig } from './loader.js';

export function mergeConfig(
  fileConfig: MultiMindConfig,
  cliOpts: Partial<MultiMindConfig>,
): MultiMindConfig {
  return {
    model: cliOpts.model ?? fileConfig.model,
    output_dir: cliOpts.output_dir ?? fileConfig.output_dir,
    agents_dir: cliOpts.agents_dir ?? fileConfig.agents_dir,
    language: cliOpts.language ?? fileConfig.language,
    agents: cliOpts.agents ?? fileConfig.agents,
  };
}
