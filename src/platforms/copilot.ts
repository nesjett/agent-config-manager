import { join } from '@std/path';
import type { AgentConfig } from '../types.ts';
import { BasePlatformHandler } from './base.ts';

/**
 * GitHub Copilot platform handler
 * Handles .github/copilot-instructions.md and VS Code settings
 */
export class CopilotHandler extends BasePlatformHandler {
  name = 'copilot' as const;

  private getRootPath(): string {
    return Deno.cwd();
  }

  getConfigPath(): string {
    return join(this.getRootPath(), '.github');
  }

  private getInstructionsPath(): string {
    return join(this.getConfigPath(), 'copilot-instructions.md');
  }

  async detect(): Promise<boolean> {
    return await this.fileExists(this.getInstructionsPath());
  }

  async export(): Promise<AgentConfig> {
    const config = this.createEmptyConfig();

    // Read copilot-instructions.md
    const instructionsPath = this.getInstructionsPath();
    if (await this.fileExists(instructionsPath)) {
      const content = await Deno.readTextFile(instructionsPath);
      config.config.instructions?.push(content);
    }

    // Try to read VS Code settings for Copilot configuration
    const vscodeSettingsPath = join(this.getRootPath(), '.vscode', 'settings.json');
    if (await this.fileExists(vscodeSettingsPath)) {
      const settings = await this.readJsonFile<Record<string, unknown>>(vscodeSettingsPath);
      if (settings) {
        // Extract Copilot-related settings
        const copilotSettings: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(settings)) {
          if (key.toLowerCase().includes('copilot') || key.toLowerCase().includes('github')) {
            copilotSettings[key] = value;
          }
        }
        if (Object.keys(copilotSettings).length > 0) {
          config.config.context = { ...config.config.context, vscodeSettings: copilotSettings };
        }
      }
    }

    return config;
  }

  async import(config: AgentConfig, merge = false): Promise<void> {
    const githubDir = this.getConfigPath();

    // Ensure .github directory exists
    await this.ensureDir(githubDir);

    // Import instructions as copilot-instructions.md
    const instructionsPath = this.getInstructionsPath();
    let content = '';

    if (merge && (await this.fileExists(instructionsPath))) {
      content = await Deno.readTextFile(instructionsPath);
      content += '\n\n---\n\n';
    }

    // Add instructions
    if (config.config.instructions && config.config.instructions.length > 0) {
      content += config.config.instructions.join('\n\n');
    }

    // Add rules as instructions
    if (config.config.rules && config.config.rules.length > 0) {
      if (content) content += '\n\n## Rules\n\n';
      content += config.config.rules
        .filter((r) => r.enabled)
        .map((r) => `### ${r.name}\n\n${r.content}`)
        .join('\n\n');
    }

    // Add skills as instructions
    if (config.config.skills && config.config.skills.length > 0) {
      if (content) content += '\n\n## Skills/Commands\n\n';
      content += config.config.skills
        .map((s) => {
          let skillContent = `### ${s.name}`;
          if (s.command) skillContent += ` (${s.command})`;
          skillContent += '\n\n';
          if (s.description) skillContent += `${s.description}\n\n`;
          skillContent += s.content;
          return skillContent;
        })
        .join('\n\n');
    }

    if (content) {
      await Deno.writeTextFile(instructionsPath, content);
    }
  }
}
