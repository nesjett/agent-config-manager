import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { copyCommand } from '../../src/commands/copy.ts';
import {
  createSampleConfig,
  ExitError,
  fixtureExists,
  readFixture,
  spyConsole,
  stubExit,
  withTempDir,
  writeFixture,
} from '../_test_helpers.ts';

Deno.test('copyCommand - --help prints help and returns', async () => {
  const consoleSpy = spyConsole();
  try {
    await copyCommand(['--help']);
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(String(consoleSpy.log.calls[0].args[0]), 'Usage:');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('copyCommand - missing --from and --to exits with 1', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => copyCommand([]), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('copyCommand - missing --to exits with 1', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => copyCommand(['--from', 'cursor']), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('copyCommand - unknown source platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(
      () => copyCommand(['--from', 'invalid', '--to', 'cursor']),
      ExitError,
    );
  } finally {
    exitStub.restore();
  }
});

Deno.test('copyCommand - unknown target platform exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(
      () => copyCommand(['--from', 'cursor', '--to', 'invalid']),
      ExitError,
    );
  } finally {
    exitStub.restore();
  }
});

Deno.test('copyCommand - --config loads from file', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await copyCommand([
        '--from',
        'cursor',
        '--to',
        'claude',
        '--config',
        `${dir}/config.json`,
      ]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Loaded configuration from');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - --config with bad file exits', async () => {
  await withTempDir(async (dir) => {
    const exitStub = stubExit();
    try {
      await assertRejects(
        () =>
          copyCommand([
            '--from',
            'cursor',
            '--to',
            'claude',
            '--config',
            `${dir}/nonexistent.json`,
          ]),
        ExitError,
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('copyCommand - normal export from source (not detected)', async () => {
  await withTempDir(async () => {
    const consoleSpy = spyConsole();
    try {
      await copyCommand(['--from', 'cursor', '--to', 'claude']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'No cursor configuration detected');
      assertStringIncludes(output, 'Exported configuration from cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - --validate mode returns without importing', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await copyCommand([
        '--from',
        'cursor',
        '--to',
        'claude',
        '--validate',
      ]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Validation mode');
      assertStringIncludes(output, 'Configuration is valid for import');

      // Should NOT create CLAUDE.md
      const exists = await fixtureExists(dir, 'CLAUDE.md');
      assertEquals(exists, false);
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - --dry-run prints config JSON', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await copyCommand(['--from', 'cursor', '--to', 'claude', '--dry-run']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Dry run mode');
      assertStringIncludes(output, '"platform"');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - --output saves config to file', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await copyCommand([
        '--from',
        'cursor',
        '--to',
        'claude',
        '--output',
        `${dir}/out.json`,
      ]);

      const exists = await fixtureExists(dir, 'out.json');
      assertEquals(exists, true);

      const content = await readFixture(dir, 'out.json');
      const parsed = JSON.parse(content);
      assertEquals(parsed.platform, 'cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - --output write failure exits', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const exitStub = stubExit();
    try {
      await assertRejects(
        () =>
          copyCommand([
            '--from',
            'cursor',
            '--to',
            'claude',
            '--output',
            '/bad/path/out.json',
          ]),
        ExitError,
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('copyCommand - full copy flow (export + import)', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await copyCommand(['--from', 'cursor', '--to', 'claude']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Exported configuration from cursor');
      assertStringIncludes(output, 'Imported configuration to claude');
      assertStringIncludes(output, 'Configuration copied successfully');

      // Verify CLAUDE.md was created
      const exists = await fixtureExists(dir, 'CLAUDE.md');
      assertEquals(exists, true);
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - getConfigStats with all elements', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig({
      config: {
        instructions: ['inst1', 'inst2'],
        rules: [
          { name: 'rule1', content: 'content', enabled: true },
          { name: 'rule2', content: 'content', enabled: true },
        ],
        skills: [
          { name: 'skill1', content: 'content' },
        ],
        tools: [
          { name: 'tool1', type: 'type', description: 'desc', config: {} },
        ],
        mcpServers: [
          { name: 'server1', command: 'cmd' },
          { name: 'server2', command: 'cmd' },
        ],
      },
    });
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await copyCommand([
        '--from',
        'cursor',
        '--to',
        'claude',
        '--config',
        `${dir}/config.json`,
      ]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, '2 instruction(s)');
      assertStringIncludes(output, '2 rule(s)');
      assertStringIncludes(output, '1 skill(s)');
      assertStringIncludes(output, '1 tool(s)');
      assertStringIncludes(output, '2 MCP server(s)');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - getConfigStats with no elements', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig({
      config: {
        instructions: [],
        rules: [],
        skills: [],
        tools: [],
        mcpServers: [],
      },
    });
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await copyCommand([
        '--from',
        'cursor',
        '--to',
        'claude',
        '--config',
        `${dir}/config.json`,
      ]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'no configuration elements');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('copyCommand - aliases -f -t work', async () => {
  await withTempDir(async (dir) => {
    await writeFixture(dir, '.cursor/rules/test.mdc', 'Test rule');

    const consoleSpy = spyConsole();
    try {
      await copyCommand(['-f', 'cursor', '-t', 'claude']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Configuration copied successfully');
    } finally {
      consoleSpy.restore();
    }
  });
});
