import { join } from '@std/path';
import type { AgentConfig, Skill } from '../types.ts';
import { BasePlatformHandler } from './base.ts';

/**
 * Claude Code platform handler
 * Handles .claude directory and CLAUDE.md files
 */
export class ClaudeHandler extends BasePlatformHandler {
  name = 'claude' as const;

  private getRootPath(): string {
    return Deno.cwd();
  }

  getConfigPath(): string {
    return join(this.getRootPath(), '.claude');
  }

  async detect(): Promise<boolean> {
    const claudeDir = await this.fileExists(this.getConfigPath());
    const claudeMd = await this.fileExists(
      join(this.getRootPath(), 'CLAUDE.md'),
    );
    return claudeDir || claudeMd;
  }

  async export(): Promise<AgentConfig> {
    const config = this.createEmptyConfig();
    const claudeDir = this.getConfigPath();

    // Read CLAUDE.md from project root
    const claudeMdPath = join(this.getRootPath(), 'CLAUDE.md');
    if (await this.fileExists(claudeMdPath)) {
      const content = await Deno.readTextFile(claudeMdPath);
      config.config.instructions?.push(content);
    }

    // Read settings.json from .claude directory
    const settingsPath = join(claudeDir, 'settings.json');
    if (await this.fileExists(settingsPath)) {
      const settings = await this.readJsonFile<Record<string, unknown>>(
        settingsPath,
      );
      if (settings) {
        config.config.context = { ...config.config.context, settings };
      }
    }

    // Read MCP servers from .claude/settings.json or mcp.json
    const mcpConfigPath = join(claudeDir, 'mcp.json');
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

    // Read commands/skills from .claude/commands directory
    const commandsDir = join(claudeDir, 'commands');
    if (await this.fileExists(commandsDir)) {
      try {
        for await (const entry of Deno.readDir(commandsDir)) {
          if (entry.isFile && entry.name.endsWith('.md')) {
            const commandPath = join(commandsDir, entry.name);
            const content = await Deno.readTextFile(commandPath);
            const commandName = entry.name.replace('.md', '');

            config.config.skills?.push({
              name: commandName,
              command: `/${commandName}`,
              content: content,
            });
          }
        }
      } catch {
        // Commands directory exists but can't be read
      }
    }

    return config;
  }

  async import(config: AgentConfig, merge = false): Promise<void> {
    const claudeDir = this.getConfigPath();

    // Ensure .claude directory exists
    await this.ensureDir(claudeDir);

    // Import instructions as CLAUDE.md
    if (config.config.instructions && config.config.instructions.length > 0) {
      const claudeMdPath = join(this.getRootPath(), 'CLAUDE.md');
      let existingContent = '';

      if (merge && (await this.fileExists(claudeMdPath))) {
        existingContent = await Deno.readTextFile(claudeMdPath);
        existingContent += '\n\n---\n\n';
      }

      await Deno.writeTextFile(
        claudeMdPath,
        existingContent + config.config.instructions.join('\n\n'),
      );
    }

    // Import MCP servers
    if (config.config.mcpServers && config.config.mcpServers.length > 0) {
      const mcpConfigPath = join(claudeDir, 'mcp.json');
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

    // Import skills as commands
    if (config.config.skills && config.config.skills.length > 0) {
      const commandsDir = join(claudeDir, 'commands');
      await this.ensureDir(commandsDir);

      for (const skill of config.config.skills) {
        const commandPath = join(commandsDir, `${skill.name}.md`);
        let content = '';
        if (skill.description) {
          content += `# ${skill.name}\n\n${skill.description}\n\n`;
        }
        content += skill.content;
        await Deno.writeTextFile(commandPath, content);
      }
    }

    // Import rules as part of CLAUDE.md
    if (config.config.rules && config.config.rules.length > 0) {
      const claudeMdPath = join(this.getRootPath(), 'CLAUDE.md');
      let existingContent = '';

      if (await this.fileExists(claudeMdPath)) {
        existingContent = await Deno.readTextFile(claudeMdPath);
        existingContent += '\n\n## Rules\n\n';
      }

      const rulesContent = config.config.rules
        .filter((r) => r.enabled)
        .map((r) => `### ${r.name}\n\n${r.content}`)
        .join('\n\n');

      await Deno.writeTextFile(claudeMdPath, existingContent + rulesContent);
    }
  }
}
