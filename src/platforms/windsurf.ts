import { join } from '@std/path';
import type { AgentConfig } from '../types.ts';
import { BasePlatformHandler } from './base.ts';

/**
 * Windsurf IDE platform handler
 * Handles .windsurfrules and related configuration
 */
export class WindsurfHandler extends BasePlatformHandler {
  name = 'windsurf' as const;

  private getRootPath(): string {
    return Deno.cwd();
  }

  getConfigPath(): string {
    return join(this.getRootPath(), '.windsurf');
  }

  private getRulesPath(): string {
    return join(this.getRootPath(), '.windsurfrules');
  }

  async detect(): Promise<boolean> {
    const rulesFile = await this.fileExists(this.getRulesPath());
    const configDir = await this.fileExists(this.getConfigPath());
    return rulesFile || configDir;
  }

  async export(): Promise<AgentConfig> {
    const config = this.createEmptyConfig();

    // Read .windsurfrules file
    const rulesPath = this.getRulesPath();
    if (await this.fileExists(rulesPath)) {
      const content = await Deno.readTextFile(rulesPath);
      config.config.instructions?.push(content);
    }

    // Read cascade config from .windsurf directory
    const cascadePath = join(this.getConfigPath(), 'cascade.json');
    if (await this.fileExists(cascadePath)) {
      const cascadeConfig = await this.readJsonFile<Record<string, unknown>>(
        cascadePath,
      );
      if (cascadeConfig) {
        config.config.context = {
          ...config.config.context,
          cascade: cascadeConfig,
        };
      }
    }

    // Read MCP servers if configured
    const mcpConfigPath = join(this.getConfigPath(), 'mcp.json');
    if (await this.fileExists(mcpConfigPath)) {
      const mcpConfig = await this.readJsonFile<{
        mcpServers?: Record<
          string,
          { command: string; args?: string[]; env?: Record<string, string> }
        >;
      }>(mcpConfigPath);
      if (mcpConfig?.mcpServers) {
        config.config.mcpServers = Object.entries(mcpConfig.mcpServers).map(
          ([name, server]) => ({
            name,
            command: server.command,
            args: server.args,
            env: server.env,
          }),
        );
      }
    }

    return config;
  }

  async import(config: AgentConfig, merge = false): Promise<void> {
    const windsurfDir = this.getConfigPath();

    // Ensure .windsurf directory exists
    await this.ensureDir(windsurfDir);

    // Import instructions as .windsurfrules
    const rulesPath = this.getRulesPath();
    let content = '';

    if (merge && (await this.fileExists(rulesPath))) {
      content = await Deno.readTextFile(rulesPath);
      content += '\n\n---\n\n';
    }

    if (config.config.instructions && config.config.instructions.length > 0) {
      content += config.config.instructions.join('\n\n');
    }

    // Add rules
    if (config.config.rules && config.config.rules.length > 0) {
      if (content) content += '\n\n## Rules\n\n';
      content += config.config.rules
        .filter((r) => r.enabled)
        .map((r) => `### ${r.name}\n\n${r.content}`)
        .join('\n\n');
    }

    // Add skills
    if (config.config.skills && config.config.skills.length > 0) {
      if (content) content += '\n\n## Skills\n\n';
      content += config.config.skills
        .map((s) => {
          let skillContent = `### ${s.name}\n\n`;
          if (s.description) skillContent += `${s.description}\n\n`;
          skillContent += s.content;
          return skillContent;
        })
        .join('\n\n');
    }

    if (content) {
      await Deno.writeTextFile(rulesPath, content);
    }

    // Import MCP servers
    if (config.config.mcpServers && config.config.mcpServers.length > 0) {
      const mcpConfigPath = join(windsurfDir, 'mcp.json');
      let existingMcp: { mcpServers: Record<string, unknown> } = {
        mcpServers: {},
      };

      if (merge && (await this.fileExists(mcpConfigPath))) {
        existingMcp =
          (await this.readJsonFile<{ mcpServers: Record<string, unknown> }>(
            mcpConfigPath,
          )) || existingMcp;
      }

      for (const server of config.config.mcpServers) {
        existingMcp.mcpServers[server.name] = {
          command: server.command,
          args: server.args,
          env: server.env,
        };
      }

      await this.writeJsonFile(mcpConfigPath, existingMcp);
    }
  }
}
