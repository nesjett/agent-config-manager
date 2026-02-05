import { join } from '@std/path';
import type { AgentConfig, Skill } from '../types.ts';
import { BasePlatformHandler } from './base.ts';

/**
 * Cursor IDE platform handler
 * Handles .cursor directory configuration
 */
export class CursorHandler extends BasePlatformHandler {
  name = 'cursor' as const;

  private getRootPath(): string {
    return Deno.cwd();
  }

  getConfigPath(): string {
    return join(this.getRootPath(), '.cursor');
  }

  private getRulesPath(): string {
    return join(this.getConfigPath(), 'rules');
  }

  async detect(): Promise<boolean> {
    return await this.fileExists(this.getConfigPath());
  }

  async export(): Promise<AgentConfig> {
    const config = this.createEmptyConfig();
    const cursorDir = this.getConfigPath();
    const rulesDir = this.getRulesPath();

    // Read rules from .cursor/rules directory
    if (await this.fileExists(rulesDir)) {
      try {
        for await (const entry of Deno.readDir(rulesDir)) {
          if (entry.isFile && entry.name.endsWith('.mdc')) {
            const rulePath = join(rulesDir, entry.name);
            const content = await Deno.readTextFile(rulePath);
            const ruleName = entry.name.replace('.mdc', '');

            config.config.rules?.push({
              name: ruleName,
              content: content,
              enabled: true,
            });
          }
        }
      } catch {
        // Rules directory exists but can't be read
      }
    }

    // Read .cursorrules file from project root (legacy format)
    const legacyRulesPath = join(this.getRootPath(), '.cursorrules');
    if (await this.fileExists(legacyRulesPath)) {
      const content = await Deno.readTextFile(legacyRulesPath);
      config.config.instructions?.push(content);
    }

    // Read MCP servers config if exists
    const mcpConfigPath = join(cursorDir, 'mcp.json');
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
    const cursorDir = this.getConfigPath();
    const rulesDir = this.getRulesPath();

    // Ensure .cursor directory exists
    await this.ensureDir(cursorDir);
    await this.ensureDir(rulesDir);

    // Import rules
    if (config.config.rules && config.config.rules.length > 0) {
      for (const rule of config.config.rules) {
        const rulePath = join(rulesDir, `${rule.name}.mdc`);
        await Deno.writeTextFile(rulePath, rule.content);
      }
    }

    // Import instructions as .cursorrules (legacy format)
    if (config.config.instructions && config.config.instructions.length > 0) {
      const legacyRulesPath = join(this.getRootPath(), '.cursorrules');
      let existingContent = '';

      if (merge && (await this.fileExists(legacyRulesPath))) {
        existingContent = await Deno.readTextFile(legacyRulesPath);
        existingContent += '\n\n';
      }

      await Deno.writeTextFile(
        legacyRulesPath,
        existingContent + config.config.instructions.join('\n\n'),
      );
    }

    // Import MCP servers
    if (config.config.mcpServers && config.config.mcpServers.length > 0) {
      const mcpConfigPath = join(cursorDir, 'mcp.json');
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

    // Import skills as custom commands in a skills file
    if (config.config.skills && config.config.skills.length > 0) {
      const skillsPath = join(rulesDir, '_skills.mdc');
      const skillsContent = this.formatSkillsAsRules(config.config.skills);
      await Deno.writeTextFile(skillsPath, skillsContent);
    }
  }

  private formatSkillsAsRules(skills: Skill[]): string {
    let content = '# Imported Skills\n\n';
    for (const skill of skills) {
      content += `## ${skill.name}\n`;
      if (skill.description) {
        content += `${skill.description}\n\n`;
      }
      content += `${skill.content}\n\n`;
    }
    return content;
  }
}
