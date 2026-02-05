import { assert, assertStringIncludes } from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { listCommand } from '../../src/commands/list.ts';
import { spyConsole, withTempDir, writeFixture } from '../_test_helpers.ts';

Deno.test('listCommand - --help prints help', async () => {
  const consoleSpy = spyConsole();
  try {
    await listCommand(['--help']);
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(String(consoleSpy.log.calls[0].args[0]), 'Usage:');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('listCommand - no flags shows all sections', async () => {
  await withTempDir(async () => {
    const consoleSpy = spyConsole();
    try {
      await listCommand([]);

      // Should show all 4 sections
      const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
        '\n',
      );
      assertStringIncludes(output, 'Supported Platforms');
      assertStringIncludes(output, 'Detected Platforms');
      assertStringIncludes(output, 'Transferable Configuration Elements');
      assertStringIncludes(output, 'Platform Configuration File Mappings');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('listCommand - --platforms only', async () => {
  const consoleSpy = spyConsole();
  try {
    await listCommand(['--platforms']);

    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'Supported Platforms');
    assertStringIncludes(output, 'cursor');
    assertStringIncludes(output, 'claude');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('listCommand - --detect with no platforms', async () => {
  await withTempDir(async () => {
    const consoleSpy = spyConsole();
    try {
      await listCommand(['--detect']);

      const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
        '\n',
      );
      assertStringIncludes(output, 'No platforms detected');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('listCommand - --detect with platforms found', async () => {
  await withTempDir(async (dir) => {
    await Deno.mkdir(`${dir}/.cursor`);

    const consoleSpy = spyConsole();
    try {
      await listCommand(['--detect']);

      const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
        '\n',
      );
      assertStringIncludes(output, 'cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('listCommand - --elements only', async () => {
  const consoleSpy = spyConsole();
  try {
    await listCommand(['--elements']);

    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'Transferable Configuration Elements');
    assertStringIncludes(output, 'instructions');
    assertStringIncludes(output, 'skills');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('listCommand - --mappings only', async () => {
  const consoleSpy = spyConsole();
  try {
    await listCommand(['--mappings']);

    const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
      '\n',
    );
    assertStringIncludes(output, 'Platform Configuration File Mappings');
    assertStringIncludes(output, '.cursor/rules/*.mdc');
    assertStringIncludes(output, 'CLAUDE.md');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('listCommand - multiple flags', async () => {
  await withTempDir(async () => {
    const consoleSpy = spyConsole();
    try {
      await listCommand(['--platforms', '--detect']);

      const output = consoleSpy.log.calls.map((c) => String(c.args[0])).join(
        '\n',
      );
      assertStringIncludes(output, 'Supported Platforms');
      assertStringIncludes(output, 'Detected Platforms');
      // Should NOT include elements or mappings
      assert(!output.includes('Transferable Configuration Elements'));
      assert(!output.includes('Platform Configuration File Mappings'));
    } finally {
      consoleSpy.restore();
    }
  });
});
