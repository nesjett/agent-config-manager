import { assertRejects, assertStringIncludes } from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { main } from '../src/main.ts';
import {
  ExitError,
  spyConsole,
  stubArgs,
  stubExit,
  stubGitCheck,
} from './_test_helpers.ts';
import denoConfig from '../deno.json' with { type: 'json' };

Deno.test('main - --version prints version', async () => {
  const argsStub = stubArgs(['--version']);
  const consoleSpy = spyConsole();
  try {
    await main();
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(
      String(consoleSpy.log.calls[0].args[0]),
      denoConfig.version,
    );
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - no command shows help', async () => {
  const argsStub = stubArgs([]);
  const consoleSpy = spyConsole();
  try {
    await main();
    assertSpyCalls(consoleSpy.log, 1);
    const output = String(consoleSpy.log.calls[0].args[0]);
    assertStringIncludes(output, 'Usage:');
    assertStringIncludes(output, 'Commands:');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - --help shows help', async () => {
  const argsStub = stubArgs(['--help']);
  const consoleSpy = spyConsole();
  try {
    await main();
    assertSpyCalls(consoleSpy.log, 1);
    const output = String(consoleSpy.log.calls[0].args[0]);
    assertStringIncludes(output, 'Usage:');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - copy command routes correctly', async () => {
  const argsStub = stubArgs(['copy', '--help']);
  const gitStub = stubGitCheck(true);
  const consoleSpy = spyConsole();
  try {
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'Usage:');
    assertStringIncludes(output, 'acm copy');
  } finally {
    argsStub.restore();
    gitStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - export command routes', async () => {
  const argsStub = stubArgs(['export', '--help']);
  const consoleSpy = spyConsole();
  try {
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'acm export');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - import command routes (git check passes)', async () => {
  const argsStub = stubArgs(['import', '--help']);
  const gitStub = stubGitCheck(true);
  const consoleSpy = spyConsole();
  try {
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'acm import');
  } finally {
    argsStub.restore();
    gitStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - import command cancelled by git check', async () => {
  const argsStub = stubArgs(['import', '--help']);
  const gitStub = stubGitCheck(false);
  const exitStub = stubExit();
  try {
    await assertRejects(() => main(), ExitError);
  } finally {
    argsStub.restore();
    gitStub.restore();
    exitStub.restore();
  }
});

Deno.test('main - copy command cancelled by git check', async () => {
  const argsStub = stubArgs(['copy', '--help']);
  const gitStub = stubGitCheck(false);
  const exitStub = stubExit();
  try {
    await assertRejects(() => main(), ExitError);
  } finally {
    argsStub.restore();
    gitStub.restore();
    exitStub.restore();
  }
});

Deno.test('main - list command routes', async () => {
  const argsStub = stubArgs(['list', '--help']);
  const consoleSpy = spyConsole();
  try {
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'acm list');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - backup command routes', async () => {
  const argsStub = stubArgs(['backup', '--help']);
  const consoleSpy = spyConsole();
  try {
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'acm backup');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - unknown command exits', async () => {
  const argsStub = stubArgs(['foobar']);
  const exitStub = stubExit();
  const consoleSpy = spyConsole();
  try {
    await assertRejects(() => main(), ExitError);
    assertStringIncludes(
      String(consoleSpy.error.calls[0].args),
      'Unknown command: foobar',
    );
  } finally {
    argsStub.restore();
    exitStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - -v alias for version', async () => {
  const argsStub = stubArgs(['-v']);
  const consoleSpy = spyConsole();
  try {
    await main();
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(
      String(consoleSpy.log.calls[0].args[0]),
      denoConfig.version,
    );
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - -h alias for help', async () => {
  const argsStub = stubArgs(['-h']);
  const consoleSpy = spyConsole();
  try {
    await main();
    assertSpyCalls(consoleSpy.log, 1);
    const output = String(consoleSpy.log.calls[0].args[0]);
    assertStringIncludes(output, 'Usage:');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});

Deno.test('main - non-modifying commands skip git check', async () => {
  const argsStub = stubArgs(['list', '--help']);
  const consoleSpy = spyConsole();
  try {
    // No git stub needed - should work without git check
    await main();
    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'acm list');
  } finally {
    argsStub.restore();
    consoleSpy.restore();
  }
});
