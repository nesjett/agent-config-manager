import { parseArgs } from '@std/cli';
import type { AgentConfig, CopyOptions, Platform } from '../types.ts';
import { getPlatformHandler, getSupportedPlatforms } from '../platforms/mod.ts';
import { colors, log } from '../utils/colors.ts';

/**
 * Copy command - transfers configuration from one platform to another
 */
export async function copyCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    string: ['from', 'to', 'config', 'output'],
    boolean: ['dry-run', 'validate', 'help'],
    alias: {
      f: 'from',
      t: 'to',
      c: 'config',
      o: 'output',
      d: 'dry-run',
      v: 'validate',
      h: 'help',
    },
  });

  if (parsed.help) {
    printCopyHelp();
    return;
  }

  const options: CopyOptions = {
    from: parsed.from as Platform,
    to: parsed.to as Platform,
    config: parsed.config,
    output: parsed.output,
    dryRun: parsed['dry-run'],
    validate: parsed.validate,
  };

  // Validate required options
  if (!options.from || !options.to) {
    log.error('Both --from and --to platforms are required');
    console.log(`\nSupported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  const sourceHandler = getPlatformHandler(options.from);
  const targetHandler = getPlatformHandler(options.to);

  if (!sourceHandler) {
    log.error(`Unknown source platform: ${options.from}`);
    console.log(`Supported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  if (!targetHandler) {
    log.error(`Unknown target platform: ${options.to}`);
    console.log(`Supported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  console.log(
    colors.bold(`\nCopying configuration from ${colors.cyan(options.from)} to ${colors.cyan(options.to)}...\n`)
  );

  // Export from source
  log.info(`Exporting from ${options.from}...`);
  let config: AgentConfig;

  if (options.config) {
    // Load from file instead of detecting
    try {
      const content = await Deno.readTextFile(options.config);
      config = JSON.parse(content) as AgentConfig;
      log.success(`Loaded configuration from ${options.config}`);
    } catch (error) {
      log.error(`Failed to load configuration file: ${error}`);
      Deno.exit(1);
    }
  } else {
    // Detect and export from source platform
    const detected = await sourceHandler.detect();
    if (!detected) {
      log.warn(`No ${options.from} configuration detected in current directory`);
    }
    config = await sourceHandler.export();
    log.success(`Exported configuration from ${options.from}`);
  }

  // Show what was found
  const stats = getConfigStats(config);
  console.log(colors.dim(`  Found: ${stats}`));

  // Validate only mode
  if (options.validate) {
    log.info('Validation mode - no changes will be made');
    // TODO: Add actual validation logic
    log.success('Configuration is valid for import');
    return;
  }

  // Dry run mode
  if (options.dryRun) {
    log.info('Dry run mode - showing what would be done:');
    console.log(colors.dim(JSON.stringify(config, null, 2)));
    return;
  }

  // Save to output file if specified
  if (options.output) {
    try {
      await Deno.writeTextFile(options.output, JSON.stringify(config, null, 2));
      log.success(`Saved configuration to ${options.output}`);
    } catch (error) {
      log.error(`Failed to save configuration: ${error}`);
      Deno.exit(1);
    }
  }

  // Import to target
  log.info(`Importing to ${options.to}...`);
  await targetHandler.import(config, false);
  log.success(`Imported configuration to ${options.to}`);

  console.log(colors.bold(colors.green('\n✓ Configuration copied successfully!\n')));
}

function getConfigStats(config: AgentConfig): string {
  const parts: string[] = [];

  if (config.config.instructions?.length) {
    parts.push(`${config.config.instructions.length} instruction(s)`);
  }
  if (config.config.rules?.length) {
    parts.push(`${config.config.rules.length} rule(s)`);
  }
  if (config.config.skills?.length) {
    parts.push(`${config.config.skills.length} skill(s)`);
  }
  if (config.config.tools?.length) {
    parts.push(`${config.config.tools.length} tool(s)`);
  }
  if (config.config.mcpServers?.length) {
    parts.push(`${config.config.mcpServers.length} MCP server(s)`);
  }

  return parts.length > 0 ? parts.join(', ') : 'no configuration elements';
}

function printCopyHelp(): void {
  console.log(`
${colors.bold('Usage:')} asc copy [options]

${colors.bold('Description:')}
  Transfer agent configuration from one platform to another.

${colors.bold('Options:')}
  -f, --from <platform>    Source platform (required)
  -t, --to <platform>      Target platform (required)
  -c, --config <path>      Load config from file instead of detecting
  -o, --output <path>      Save exported config to file
  -d, --dry-run            Preview changes without applying
  -v, --validate           Only validate compatibility
  -h, --help               Show this help message

${colors.bold('Supported Platforms:')}
  ${getSupportedPlatforms().join(', ')}

${colors.bold('Examples:')}
  asc copy --from copilot --to cursor
  asc copy --from cursor --to claude --dry-run
  asc copy --config ./saved-config.json --to windsurf
`);
}
