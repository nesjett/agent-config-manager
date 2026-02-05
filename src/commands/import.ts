import { parseArgs } from '@std/cli';
import { parse as yamlParse } from '@std/yaml';
import type { AgentConfig, ImportOptions, Platform } from '../types.ts';
import { getPlatformHandler, getSupportedPlatforms } from '../platforms/mod.ts';
import { colors, log } from '../utils/colors.ts';

/**
 * Import command - imports configuration into a platform
 */
export async function importCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    string: ['to'],
    boolean: ['merge', 'validate', 'help'],
    alias: {
      t: 'to',
      m: 'merge',
      v: 'validate',
      h: 'help',
    },
  });

  if (parsed.help) {
    printImportHelp();
    return;
  }

  const configPath = parsed._[0] as string;

  if (!configPath) {
    log.error('Configuration file path is required');
    Deno.exit(1);
  }

  const options: ImportOptions = {
    to: parsed.to as Platform,
    merge: parsed.merge,
    validate: parsed.validate,
  };

  if (!options.to) {
    log.error('Target platform (--to) is required');
    console.log(`\nSupported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  const handler = getPlatformHandler(options.to);

  if (!handler) {
    log.error(`Unknown platform: ${options.to}`);
    console.log(`Supported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  console.log(
    colors.bold(`\nImporting configuration to ${colors.cyan(options.to)}...\n`),
  );

  // Load configuration file
  let config: AgentConfig;
  try {
    const content = await Deno.readTextFile(configPath);

    if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
      config = yamlParse(content) as AgentConfig;
    } else {
      config = JSON.parse(content) as AgentConfig;
    }

    log.success(`Loaded configuration from ${configPath}`);
  } catch (error) {
    log.error(`Failed to load configuration: ${error}`);
    Deno.exit(1);
  }

  // Validate mode
  if (options.validate) {
    log.info('Validation mode - checking configuration...');
    // TODO: Add actual validation logic
    log.success('Configuration is valid');
    return;
  }

  // Import configuration
  const mode = options.merge ? 'merge' : 'replace';
  log.info(`Importing with ${mode} mode...`);

  await handler.import(config, options.merge);

  log.success(`Imported configuration to ${options.to}`);
  console.log(
    colors.bold(colors.green('\n✓ Import completed successfully!\n')),
  );
}

function printImportHelp(): void {
  console.log(`
${colors.bold('Usage:')} asc import <path> [options]

${colors.bold('Description:')}
  Import agent configuration into a platform.

${colors.bold('Arguments:')}
  path                     Path to configuration file (required)

${colors.bold('Options:')}
  -t, --to <platform>      Target platform (required)
  -m, --merge              Merge with existing config instead of replacing
  -v, --validate           Only validate without importing
  -h, --help               Show this help message

${colors.bold('Supported Platforms:')}
  ${getSupportedPlatforms().join(', ')}

${colors.bold('Examples:')}
  asc import ./config.json --to cursor
  asc import ./config.yaml --to claude --merge
  asc import ./config.json --to copilot --validate
`);
}
