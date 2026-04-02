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
  system_prompt_file?: string;
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
  failedAgents: string[];
  totalDurationMs: number;
  rounds?: AgentResult[][];
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

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
}

export interface ProfileConfig {
  name: string;
  config_dir: string;
}

export interface GlobalOptions {
  verbose: boolean;
  outputDir: string;
  model?: string;
  agents?: string[];
  retry?: RetryConfig;
  profiles?: ProfileConfig[];
}
