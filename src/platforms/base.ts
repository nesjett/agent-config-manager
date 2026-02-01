import type { AgentConfig, Platform, PlatformHandler } from '../types.ts';

/**
 * Base platform handler with common functionality
 */
export abstract class BasePlatformHandler implements PlatformHandler {
  abstract name: Platform;

  abstract detect(): Promise<boolean>;
  abstract export(): Promise<AgentConfig>;
  abstract import(config: AgentConfig, merge?: boolean): Promise<void>;
  abstract getConfigPath(): string;

  /**
   * Create a new empty config for this platform
   */
  protected createEmptyConfig(): AgentConfig {
    return {
      version: '1.0.0',
      platform: this.name,
      timestamp: new Date().toISOString(),
      config: {
        skills: [],
        tools: [],
        rules: [],
        instructions: [],
        context: {},
        shortcuts: {},
      },
    };
  }

  /**
   * Check if a file exists
   */
  protected async fileExists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read JSON file safely
   */
  protected async readJsonFile<T>(path: string): Promise<T | null> {
    try {
      const content = await Deno.readTextFile(path);
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Write JSON file
   */
  protected async writeJsonFile(path: string, data: unknown): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await Deno.writeTextFile(path, content);
  }

  /**
   * Ensure directory exists
   */
  protected async ensureDir(path: string): Promise<void> {
    try {
      await Deno.mkdir(path, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }
}
