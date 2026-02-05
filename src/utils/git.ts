import { colors, log } from './colors.ts';

/**
 * Check if the current directory is part of a git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    const process = new Deno.Command('git', {
      args: ['rev-parse', '--git-dir'],
      stdout: 'null',
      stderr: 'null',
    });
    const { success } = await process.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Prompt user for confirmation if not in a git repository
 * Returns true if user confirms or if in a git repo
 * Returns false if user cancels
 */
export async function checkGitRepositoryWithPrompt(): Promise<boolean> {
  const isGit = await isGitRepository();

  if (isGit) {
    return true;
  }

  // Not in a git repository - warn and prompt
  console.log('');
  log.warn('You are not in a git repository!');
  console.log(colors.yellow('  It is recommended to use version control when modifying agent configurations.'));
  console.log(colors.yellow('  This allows you to track changes and revert if needed.'));
  console.log('');

  // Prompt for confirmation
  const response = prompt(colors.bold('Do you want to continue anyway? (y/N): '));

  if (!response || response.toLowerCase() !== 'y') {
    log.error('Operation cancelled');
    return false;
  }

  return true;
}
