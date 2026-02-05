import { spy, stub } from '@std/testing/mock';
import type { Spy } from '@std/testing/mock';
import type { AgentConfig } from '../src/types.ts';
import { join } from '@std/path';

/**
 * Creates a temp directory and stubs Deno.cwd() to return it.
 * Automatically cleans up after the test.
 */
export async function withTempDir(
  fn: (dir: string) => Promise<void>
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'asc_test_' });
  const cwdStub = stub(Deno, 'cwd', () => dir);
  try {
    await fn(dir);
  } finally {
    cwdStub.restore();
    await Deno.remove(dir, { recursive: true }).catch(() => {
      // Ignore cleanup errors
    });
  }
}

/**
 * Custom error thrown when Deno.exit() is called in tests
 */
export class ExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`Deno.exit(${code})`);
    this.code = code;
    this.name = 'ExitError';
  }
}

/**
 * Stubs Deno.exit to throw ExitError instead of terminating the process
 */
export function stubExit(): { restore: () => void } {
  const original = Deno.exit;
  // deno-lint-ignore no-explicit-any
  (Deno as any).exit = (code?: number) => {
    throw new ExitError(code ?? 0);
  };
  return {
    restore() {
      // deno-lint-ignore no-explicit-any
      (Deno as any).exit = original;
    },
  };
}

/**
 * Console spy helper
 */
export interface ConsoleSpy {
  log: Spy;
  error: Spy;
  restore: () => void;
}

/**
 * Spies on console.log and console.error
 */
export function spyConsole(): ConsoleSpy {
  const logSpy = spy(console, 'log');
  const errorSpy = spy(console, 'error');
  return {
    log: logSpy,
    error: errorSpy,
    restore() {
      logSpy.restore();
      errorSpy.restore();
    },
  };
}

/**
 * Creates a sample AgentConfig for testing
 */
export function createSampleConfig(
  overrides?: Partial<AgentConfig>
): AgentConfig {
  return {
    version: '1.0.0',
    platform: 'cursor',
    timestamp: new Date().toISOString(),
    config: {
      instructions: ['Test instruction'],
      rules: [{ name: 'rule1', content: 'Rule content', enabled: true }],
      skills: [
        {
          name: 'skill1',
          content: 'Skill content',
          description: 'A skill',
        },
      ],
      tools: [],
      mcpServers: [
        { name: 'server1', command: 'npx', args: ['-y', 'mcp-server'] },
      ],
      context: {},
      shortcuts: {},
    },
    ...overrides,
  };
}

/**
 * Writes a fixture file to the temp directory
 */
export async function writeFixture(
  dir: string,
  path: string,
  content: string
): Promise<void> {
  const fullPath = join(dir, path);
  const parentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
  if (parentDir && parentDir !== dir) {
    await Deno.mkdir(parentDir, { recursive: true }).catch(() => {
      // Directory might already exist
    });
  }
  await Deno.writeTextFile(fullPath, content);
}

/**
 * Reads a fixture file from the temp directory
 */
export async function readFixture(
  dir: string,
  path: string
): Promise<string> {
  return await Deno.readTextFile(join(dir, path));
}

/**
 * Checks if a fixture file exists
 */
export async function fixtureExists(
  dir: string,
  path: string
): Promise<boolean> {
  try {
    await Deno.stat(join(dir, path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Stubs git check to return a specific result
 */
export function stubGitCheck(result: boolean) {
  return stub(
    Deno,
    'Command',
    () =>
      ({
        output: () => Promise.resolve({ success: result }),
      }) as unknown as Deno.Command
  );
}

/**
 * Stubs the prompt function
 */
export function stubPrompt(response: string | null) {
  return stub(globalThis, 'prompt', () => response);
}

/**
 * Stubs Deno.args for main() testing
 */
export function stubArgs(args: string[]) {
  const original = Deno.args;
  Object.defineProperty(Deno, 'args', {
    value: args,
    writable: true,
    configurable: true,
  });
  return {
    restore() {
      Object.defineProperty(Deno, 'args', {
        value: original,
        writable: true,
        configurable: true,
      });
    },
  };
}
