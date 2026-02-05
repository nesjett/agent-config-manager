import { parseArgs } from '@std/cli';
import {
  backupCommand,
  copyCommand,
  exportCommand,
  importCommand,
  listCommand,
} from './commands/mod.ts';
import { colors } from './utils/colors.ts';
import { checkGitRepositoryWithPrompt } from './utils/git.ts';
import denoConfig from '../deno.json' with { type: 'json' };

const VERSION: string = denoConfig.version;

const BANNER = `
${colors.bold(colors.cyan('Agent Config Manager'))} ${colors.dim(`v${VERSION}`)}
${colors.dim('Transfer AI agent configurations across platforms')}
`;

const HELP = `
${BANNER}
${colors.bold('Usage:')} acm <command> [options]

${colors.bold('Commands:')}
  copy       Copy configuration from one platform to another
  export     Export configuration from a platform
  import     Import configuration into a platform
  list       List platforms and configuration elements
  backup     Create a backup of platform configuration

${colors.bold('Options:')}
  -h, --help       Show help for a command
  -v, --version    Show version number

${colors.bold('Examples:')}
  acm copy --from copilot --to cursor
  acm export cursor --output ./config.json
  acm import ./config.json --to claude
  acm list --detect
  acm backup cursor --timestamp

${colors.bold('Documentation:')}
  https://github.com/nesjett/agent-setup-copier
`;

export async function main(): Promise<void> {
  const args = Deno.args;

  // Parse top-level args
  const parsed = parseArgs(args, {
    boolean: ['help', 'version'],
    alias: {
      h: 'help',
      v: 'version',
    },
    stopEarly: true,
  });

  // Handle version
  if (parsed.version) {
    console.log(VERSION);
    return;
  }

  // Handle no command or help
  if (parsed._.length === 0 || parsed.help) {
    console.log(HELP);
    return;
  }

  const command = String(parsed._[0]);
  const commandArgs = args.slice(1);

  // Check git repository for commands that modify files
  const modifyingCommands = ['copy', 'import'];
  if (modifyingCommands.includes(command)) {
    const shouldContinue = await checkGitRepositoryWithPrompt();
    if (!shouldContinue) {
      Deno.exit(1);
    }
  }

  // Route to command handlers
  switch (command) {
    case 'copy':
      await copyCommand(commandArgs);
      break;

    case 'export':
      await exportCommand(commandArgs);
      break;

    case 'import':
      await importCommand(commandArgs);
      break;

    case 'list':
      await listCommand(commandArgs);
      break;

    case 'backup':
      await backupCommand(commandArgs);
      break;

    default:
      console.error(colors.red(`Unknown command: ${command}`));
      console.log(HELP);
      Deno.exit(1);
  }
}

// Run main
if (import.meta.main) {
  main().catch((error) => {
    console.error(colors.red('Error:'), error.message);
    Deno.exit(1);
  });
}
