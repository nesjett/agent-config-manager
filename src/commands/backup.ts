import { parseArgs } from '@std/cli';
import type { BackupOptions, Platform } from '../types.ts';
import { getPlatformHandler, getSupportedPlatforms } from '../platforms/mod.ts';
import { colors, log } from '../utils/colors.ts';

/**
 * Backup command - creates a backup of platform configuration
 */
export async function backupCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    string: ['output'],
    boolean: ['timestamp', 'help'],
    alias: {
      o: 'output',
      t: 'timestamp',
      h: 'help',
    },
  });

  if (parsed.help) {
    printBackupHelp();
    return;
  }

  const platform = parsed._[0] as Platform;

  if (!platform) {
    log.error('Platform name is required');
    console.log(`\nSupported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  const options: BackupOptions = {
    output: parsed.output,
    timestamp: parsed.timestamp,
  };

  const handler = getPlatformHandler(platform);

  if (!handler) {
    log.error(`Unknown platform: ${platform}`);
    console.log(`Supported platforms: ${getSupportedPlatforms().join(', ')}`);
    Deno.exit(1);
  }

  console.log(
    colors.bold(`\nBacking up ${colors.cyan(platform)} configuration...\n`),
  );

  // Check if platform is configured
  const detected = await handler.detect();
  if (!detected) {
    log.warn(`No ${platform} configuration detected in current directory`);
    log.info('Creating backup with empty configuration');
  }

  // Export configuration
  const config = await handler.export();
  log.success(`Exported configuration from ${platform}`);

  // Generate output filename
  let outputPath = options.output;
  if (!outputPath) {
    const timestamp = options.timestamp
      ? `-${new Date().toISOString().replace(/[:.]/g, '-')}`
      : '';
    outputPath = `${platform}-backup${timestamp}.json`;
  }

  // Save backup
  try {
    await Deno.writeTextFile(outputPath, JSON.stringify(config, null, 2));
    log.success(`Backup saved to ${outputPath}`);
  } catch (error) {
    log.error(`Failed to save backup: ${error}`);
    Deno.exit(1);
  }

  console.log(
    colors.bold(colors.green('\n✓ Backup completed successfully!\n')),
  );
}

function printBackupHelp(): void {
  console.log(`
${colors.bold('Usage:')} acm backup <platform> [options]

${colors.bold('Description:')}
  Create a backup of platform configuration.

${colors.bold('Arguments:')}
  platform                 Platform to backup (required)

${colors.bold('Options:')}
  -o, --output <path>      Output file path
  -t, --timestamp          Include timestamp in filename
  -h, --help               Show this help message

${colors.bold('Supported Platforms:')}
  ${getSupportedPlatforms().join(', ')}

${colors.bold('Examples:')}
  acm backup cursor
  acm backup copilot --timestamp
  acm backup claude --output ./backups/claude-backup.json
`);
}
