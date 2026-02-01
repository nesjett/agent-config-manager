/**
 * Supported AI agent platforms
 */
export type Platform = 'copilot' | 'cursor' | 'claude' | 'windsurf' | 'custom';

/**
 * Configuration element types that can be transferred
 */
export interface AgentConfig {
  version: string;
  platform: Platform;
  timestamp: string;
  config: {
    skills?: Skill[];
    tools?: Tool[];
    rules?: Rule[];
    instructions?: string[];
    context?: Record<string, unknown>;
    shortcuts?: Record<string, string>;
    systemPrompt?: string;
    mcpServers?: McpServer[];
  };
}

export interface Skill {
  name: string;
  description?: string;
  command?: string;
  content: string;
}

export interface Tool {
  name: string;
  description?: string;
  type: string;
  config: Record<string, unknown>;
}

export interface Rule {
  name: string;
  content: string;
  enabled: boolean;
}

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * CLI command options
 */
export interface CopyOptions {
  from: Platform;
  to: Platform;
  config?: string;
  output?: string;
  dryRun?: boolean;
  validate?: boolean;
}

export interface ExportOptions {
  output?: string;
  format?: 'json' | 'yaml';
}

export interface ImportOptions {
  to: Platform;
  merge?: boolean;
  validate?: boolean;
}

export interface ValidateOptions {
  target?: Platform;
  strict?: boolean;
}

export interface BackupOptions {
  output?: string;
  timestamp?: boolean;
}

/**
 * Platform handler interface
 */
export interface PlatformHandler {
  name: Platform;
  detect(): Promise<boolean>;
  export(): Promise<AgentConfig>;
  import(config: AgentConfig, merge?: boolean): Promise<void>;
  getConfigPath(): string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
