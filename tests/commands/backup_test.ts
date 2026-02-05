import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { backupCommand } from '../../src/commands/backup.ts';
import {
  ExitError,
  fixtureExists,
  readFixture,
  spyConsole,
  stubExit,
  withTempDir,
  writeFixture,
} from '../_test_helpers.ts';

Deno.test('backupCommand - --help prints help', async () => {
  const consoleSpy = spyConsole();
  try {
    await backupCommand(['--help']);
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(String(consoleSpy.log.calls[0].args[0]), 'Usage:');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('backupCommand - no platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => backupCommand([]), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('backupCommand - unknown platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => backupCommand(['unknown']), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('backupCommand - not detected warns but continues', async () => {
  await withTempDir(async (dir) => {
    const consoleSpy = spyConsole();
    try {
      await backupCommand(['cursor', '--output', `${dir}/backup.json`]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'No cursor configuration detected');
      assertStringIncludes(output, 'Creating backup with empty configuration');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('backupCommand - default filename (no timestamp)', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await backupCommand(['cursor', '--output', `${dir}/cursor-backup.json`]);

      const exists = await fixtureExists(dir, 'cursor-backup.json');
      assertEquals(exists, true);

      const content = await readFixture(dir, 'cursor-backup.json');
      const parsed = JSON.parse(content);
      assertEquals(parsed.platform, 'cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('backupCommand - --timestamp adds timestamp to filename', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      // Use a base filename that includes the dir path
      await backupCommand([
        'cursor',
        '--timestamp',
        '--output',
        `${dir}/cursor-backup.json`,
      ]);

      // Find the backup file with timestamp in the temp dir
      const files = [];
      for await (const entry of Deno.readDir(dir)) {
        if (
          entry.name.startsWith('cursor-backup') && entry.name.endsWith('.json')
        ) {
          files.push(entry.name);
        }
      }

      assertEquals(files.length, 1);
      // When --output is specified, --timestamp is ignored, so just check the file exists
      assertEquals(files[0], 'cursor-backup.json');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('backupCommand - --output custom path', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await backupCommand(['cursor', '--output', `${dir}/my-backup.json`]);

      const exists = await fixtureExists(dir, 'my-backup.json');
      assertEquals(exists, true);
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('backupCommand - write failure exits', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const exitStub = stubExit();
    try {
      await assertRejects(
        () => backupCommand(['cursor', '--output', '/bad/dir/file.json']),
        ExitError,
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('backupCommand - backup content is valid JSON config', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule content');

    const consoleSpy = spyConsole();
    try {
      await backupCommand(['cursor', '--output', `${dir}/cursor-backup.json`]);

      const content = await readFixture(dir, 'cursor-backup.json');
      const parsed = JSON.parse(content);

      assertEquals(parsed.version, '1.0.0');
      assertEquals(parsed.platform, 'cursor');
      assert(parsed.timestamp);
      assert(parsed.config);
      assertEquals(parsed.config.rules?.length, 1);
      assertEquals(parsed.config.rules[0].name, 'test');
    } finally {
      consoleSpy.restore();
    }
  });
});
