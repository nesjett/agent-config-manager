import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { assertSpyCalls } from '@std/testing/mock';
import { importCommand } from '../../src/commands/import.ts';
import {
  createSampleConfig,
  ExitError,
  spyConsole,
  stubExit,
  withTempDir,
  writeFixture,
} from '../_test_helpers.ts';

Deno.test('importCommand - --help prints help', async () => {
  const consoleSpy = spyConsole();
  try {
    await importCommand(['--help']);
    assertSpyCalls(consoleSpy.log, 1);
    assertStringIncludes(String(consoleSpy.log.calls[0].args[0]), 'Usage:');
  } finally {
    consoleSpy.restore();
  }
});

Deno.test('importCommand - no config path exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => importCommand(['--to', 'cursor']), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('importCommand - no --to exits', async () => {
  const exitStub = stubExit();
  try {
    await assertRejects(() => importCommand(['config.json']), ExitError);
  } finally {
    exitStub.restore();
  }
});

Deno.test('importCommand - unknown platform exits', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const exitStub = stubExit();
    try {
      await assertRejects(
        () => importCommand([`${dir}/config.json`, '--to', 'unknown']),
        ExitError,
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('importCommand - loads JSON config', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.json`, '--to', 'cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Loaded configuration');
      assertStringIncludes(output, 'Imported configuration to cursor');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - loads YAML config (.yaml)', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    const yaml = `version: "${config.version}"
platform: ${config.platform}
timestamp: "${config.timestamp}"
config:
  instructions:
    - "Test instruction"
  rules: []
  skills: []
  tools: []
  mcpServers: []
  context: {}
  shortcuts: {}
`;
    await writeFixture(dir, 'config.yaml', yaml);

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.yaml`, '--to', 'cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Loaded configuration');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - loads YAML config (.yml)', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    const yaml = `version: "${config.version}"
platform: ${config.platform}
timestamp: "${config.timestamp}"
config:
  instructions:
    - "Test instruction"
`;
    await writeFixture(dir, 'config.yml', yaml);

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.yml`, '--to', 'cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Loaded configuration');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - bad config file exits', async () => {
  await withTempDir(async (dir) => {
    const exitStub = stubExit();
    try {
      await assertRejects(
        () => importCommand([`${dir}/nonexistent.json`, '--to', 'cursor']),
        ExitError,
      );
    } finally {
      exitStub.restore();
    }
  });
});

Deno.test('importCommand - --validate mode returns early', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await importCommand([
        `${dir}/config.json`,
        '--to',
        'cursor',
        '--validate',
      ]);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Validation mode');
      assertStringIncludes(output, 'Configuration is valid');

      // Should NOT actually import (no .cursor dir should be created)
      const exists = await Deno.stat(`${dir}/.cursor`).then(
        () => true,
        () => false,
      );
      assertEquals(exists, false);
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - --merge mode', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.json`, '--to', 'cursor', '--merge']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'merge mode');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - replace mode (default)', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.json`, '--to', 'cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'replace mode');
    } finally {
      consoleSpy.restore();
    }
  });
});

Deno.test('importCommand - success message printed', async () => {
  await withTempDir(async (dir) => {
    const config = createSampleConfig();
    await writeFixture(dir, 'config.json', JSON.stringify(config));

    const consoleSpy = spyConsole();
    try {
      await importCommand([`${dir}/config.json`, '--to', 'cursor']);

      const output = consoleSpy.log.calls.map((c) => String(c.args)).join('\n');
      assertStringIncludes(output, 'Import completed successfully');
    } finally {
      consoleSpy.restore();
    }
  });
});
