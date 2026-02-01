import { parseArgs } from '@std/cli';
import { stringify as yamlStringify } from '@std/yaml';
import type { ExportOptions, Platform } from '../types.ts';
import { getPlatformHandler, getSupportedPlatforms } from '../platforms/mod.ts';
import { colors, log } from '../utils/colors.ts';

/**
 * Export command - exports configuration from a platform
 */
export async function exportCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    string: ['output', 'format'],
    boolean: ['help'],
    alias: {
      o: 'output',
      f: 'format',
      h: 'help',
    },
  });

  if (parsed.help) {
    printExportHelp();
    return;
  }

  const platform = parsed._[0] as Platform;

  if (!platform) {
    log.error('Platform name is required');
    console.log(`\nSupported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  const options: ExportOptions = {
    output: parsed.output,
    format: (parsed.format as 'json' | 'yaml') || 'json',
  };

  const handler = getPlatformHandler(platform);

  if (!handler) {
    log.error(`Unknown platform: ${platform}`);
    console.log(`Supported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  console.log(colors.bold(`\nExporting configuration from ${colors.cyan(platform)}...\n`));

  // Check if platform is configured
  const detected = await handler.detect();
  if (!detected) {
    log.warn(`No ${platform} configuration detected in current directory`);
  }

  // Export configuration
  const config = await handler.export();
  log.success(`Exported configuration from ${platform}`);

  // Format output
  let output: string;
  if (options.format === 'yaml') {
    output = yamlStringify(config as unknown as Record<string, unknown>);
  } else {
    output = JSON.stringify(config, null, 2);
  }

  // Save or print
  if (options.output) {
    try {
      await Deno.writeTextFile(options.output, output);
      log.success(`Saved to ${options.output}`);
    } catch (error) {
      log.error(`Failed to save: ${error}`);
      Deno.exit(1);
    }
  } else {
    console.log('\n' + output);
  }
}

function printExportHelp(): void {
  console.log(`
${colors.bold('Usage:')} asc export <platform> [options]

${colors.bold('Description:')}
  Export agent configuration from a platform.

${colors.bold('Arguments:')}
  platform                 Platform to export from (required)

${colors.bold('Options:')}
  -o, --output <path>      Save to file instead of stdout
  -f, --format <format>    Output format: json, yaml (default: json)
  -h, --help               Show this help message

${colors.bold('Supported Platforms:')}
  ${getSupportedPlatforms().join(', ')}

${colors.bold('Examples:')}
  asc export cursor
  asc export copilot --output ./copilot-config.json
  asc export claude --format yaml
`);
}
