import { parseArgs } from '@std/cli';
import { detectPlatforms, getSupportedPlatforms } from '../platforms/mod.ts';
import { colors, log } from '../utils/colors.ts';

/**
 * List command - shows available platforms and configuration elements
 */
export async function listCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ['platforms', 'elements', 'mappings', 'detect', 'help'],
    alias: {
      p: 'platforms',
      e: 'elements',
      m: 'mappings',
      d: 'detect',
      h: 'help',
    },
  });

  if (parsed.help) {
    printListHelp();
    return;
  }

  // If no specific flag, show all
  const showAll = !parsed.platforms && !parsed.elements && !parsed.mappings &&
    !parsed.detect;

  if (showAll || parsed.platforms) {
    console.log(colors.bold('\nSupported Platforms:\n'));
    for (const platform of getSupportedPlatforms()) {
      console.log(`  ${colors.cyan('•')} ${platform}`);
    }
  }

  if (showAll || parsed.detect) {
    console.log(colors.bold('\nDetected Platforms in Current Directory:\n'));
    const detected = await detectPlatforms();
    if (detected.length === 0) {
      console.log(colors.dim('  No platforms detected'));
    } else {
      for (const platform of detected) {
        console.log(`  ${colors.green('✓')} ${platform}`);
      }
    }
  }

  if (showAll || parsed.elements) {
    console.log(colors.bold('\nTransferable Configuration Elements:\n'));
    const elements = [
      {
        name: 'instructions',
        desc: 'System prompts and instructions (CLAUDE.md, .cursorrules, etc.)',
      },
      { name: 'rules', desc: 'Platform-specific rules and constraints' },
      { name: 'skills', desc: 'Custom commands and skills' },
      { name: 'tools', desc: 'Tool configurations and integrations' },
      {
        name: 'mcpServers',
        desc: 'Model Context Protocol server configurations',
      },
      { name: 'context', desc: 'Additional context and settings' },
      { name: 'shortcuts', desc: 'Keyboard shortcuts and hotkeys' },
    ];
    for (const el of elements) {
      console.log(`  ${colors.cyan('•')} ${colors.bold(el.name)}`);
      console.log(`    ${colors.dim(el.desc)}`);
    }
  }

  if (showAll || parsed.mappings) {
    console.log(colors.bold('\nPlatform Configuration File Mappings:\n'));
    const mappings = [
      {
        platform: 'cursor',
        files: ['.cursor/rules/*.mdc', '.cursorrules', '.cursor/mcp.json'],
      },
      {
        platform: 'claude',
        files: ['CLAUDE.md', '.claude/commands/*.md', '.claude/mcp.json'],
      },
      { platform: 'copilot', files: ['.github/copilot-instructions.md'] },
      { platform: 'windsurf', files: ['.windsurfrules', '.windsurf/mcp.json'] },
    ];
    for (const m of mappings) {
      console.log(`  ${colors.bold(m.platform)}:`);
      for (const file of m.files) {
        console.log(`    ${colors.dim('→')} ${file}`);
      }
    }
  }

  console.log('');
}

function printListHelp(): void {
  console.log(`
${colors.bold('Usage:')} acm list [options]

${colors.bold('Description:')}
  Show available platforms and configuration information.

${colors.bold('Options:')}
  -p, --platforms          List supported platforms
  -e, --elements           List transferable configuration elements
  -m, --mappings           Show platform file mappings
  -d, --detect             Detect platforms in current directory
  -h, --help               Show this help message

${colors.bold('Examples:')}
  acm list
  acm list --platforms
  acm list --detect
  acm list --mappings
`);
}
