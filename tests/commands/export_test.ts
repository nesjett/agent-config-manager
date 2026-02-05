import { assertEquals, assertStringIncludes, assertRejects } from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { exportCommand } from '../../src/commands/export.ts';
import {
  withTempDir,
  writeFixture,
  readFixture,
  spyConsole,
  stubExit,
  ExitError,
} from '../_test_helpers.ts';

Deno.test('exportCommand - --help prints help', async () => {
  const consoleSpy = spyConsole();
  try {
    await exportCommand(['--help']);
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(String(consoleSpy.log.calls[0].args[0]), 'Usage:');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('exportCommand - no platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => exportCommand([]), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('exportCommand - unknown platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => exportCommand(['unknown']), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('exportCommand - not detected warns but continues', async () => {
  await withTempDir(async () => {
    const consoleSpy = spyConsole();
    try {
      await exportCommand(['cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'No cursor configuration detected');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('exportCommand - JSON format (default)', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await exportCommand(['cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, '"platform"');
      assertStringIncludes(output, '"cursor"');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('exportCommand - YAML format', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await exportCommand(['cursor', '--format', 'yaml']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'platform: cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('exportCommand - --output saves to file', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await exportCommand(['cursor', '-o', `${dir}/out.json`]);

      const content = await readFixture(dir, 'out.json');
      const parsed = JSON.parse(content);
      assertEquals(parsed.platform, 'cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('exportCommand - --output write failure exits', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const exitStub = stubExit();
    try {
      await assertRejects(
        () => exportCommand(['cursor', '-o', '/bad/path/out.json']),
        ExitError
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('exportCommand - stdout output when no --output', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await exportCommand(['cursor']);

      // Should print JSON to console (3 calls: banner, success, output)
      assertSpyCalls(consoleSpy.log, 3);
      const lastCall = String(consoleSpy.log.calls[2].args[0]);
      assertStringIncludes(lastCall, '"platform"');
    } finally {
      consoleSpy.restore();
    }
  });
});
