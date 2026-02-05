import { assert, assertEquals, assertRejects } from '@std/assert';
import { BasePlatformHandler } from '../../src/platforms/base.ts';
import type { AgentConfig, Platform } from '../../src/types.ts';
import { withTempDir, writeFixture } from '../_test_helpers.ts';

// Create a concrete test class
class TestHandler extends BasePlatformHandler {
  name = 'cursor' as const;

  detect() {
    return Promise.resolve(true);
  }

  export() {
    return Promise.resolve(this.createEmptyConfig());
  }

  import() {
    return Promise.resolve();
  }

  getConfigPath() {
    return '/tmp/test';
  }

  // Expose protected methods for testing
  public testCreateEmptyConfig() {
    return this.createEmptyConfig();
  }

  public testFileExists(p: string) {
    return this.fileExists(p);
  }

  public testReadJsonFile<T>(p: string) {
    return this.readJsonFile<T>(p);
  }

  public testWriteJsonFile(p: string, d: unknown) {
    return this.writeJsonFile(p, d);
  }

  public testEnsureDir(p: string) {
    return this.ensureDir(p);
  }
}

Deno.test('BasePlatformHandler - createEmptyConfig returns valid structure', () => {
  const handler = new TestHandler();
  const config = handler.testCreateEmptyConfig();

  assertEquals(config.version, '1.0.0');
  assertEquals(config.platform, 'cursor');
  assert(config.timestamp);
  assertEquals(config.config.skills, []);
  assertEquals(config.config.tools, []);
  assertEquals(config.config.rules, []);
  assertEquals(config.config.instructions, []);
  assert(config.config.context);
  assert(config.config.shortcuts);
});

Deno.test('BasePlatformHandler - createEmptyConfig timestamp is current', () => {
  const handler = new TestHandler();
  const before = new Date().toISOString();
  const config = handler.testCreateEmptyConfig();
  const after = new Date().toISOString();

  assert(config.timestamp >= before);
  assert(config.timestamp <= after);
});

Deno.test('BasePlatformHandler - fileExists returns true for existing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    await writeFixture(dir, 'test.txt', 'content');

    const exists = await handler.testFileExists(`${dir}/test.txt`);
    assertEquals(exists, true);
  });
});

Deno.test('BasePlatformHandler - fileExists returns false for missing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    const exists = await handler.testFileExists(`${dir}/missing.txt`);
    assertEquals(exists, false);
  });
});

Deno.test('BasePlatformHandler - readJsonFile returns parsed JSON for valid file', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    await writeFixture(dir, 'data.json', JSON.stringify({ key: 'value' }));

    const result = await handler.testReadJsonFile<{ key: string }>(
      `${dir}/data.json`,
    );
    assertEquals(result, { key: 'value' });
  });
});

Deno.test('BasePlatformHandler - readJsonFile returns null for missing file', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    const result = await handler.testReadJsonFile(`${dir}/missing.json`);
    assertEquals(result, null);
  });
});

Deno.test('BasePlatformHandler - readJsonFile returns null for invalid JSON', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    await writeFixture(dir, 'bad.json', 'not json{{');

    const result = await handler.testReadJsonFile(`${dir}/bad.json`);
    assertEquals(result, null);
  });
});

Deno.test('BasePlatformHandler - writeJsonFile writes formatted JSON', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    const data = { test: 'data', nested: { value: 123 } };

    await handler.testWriteJsonFile(`${dir}/output.json`, data);

    const content = await Deno.readTextFile(`${dir}/output.json`);
    assertEquals(content, JSON.stringify(data, null, 2));
  });
});

Deno.test('BasePlatformHandler - ensureDir creates directory', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    const newDir = `${dir}/subdir/nested`;

    await handler.testEnsureDir(newDir);

    const stat = await Deno.stat(newDir);
    assert(stat.isDirectory);
  });
});

Deno.test('BasePlatformHandler - ensureDir succeeds when directory already exists', async () => {
  await withTempDir(async (dir) => {
    const handler = new TestHandler();
    const newDir = `${dir}/existing`;

    await Deno.mkdir(newDir);
    await handler.testEnsureDir(newDir);

    const stat = await Deno.stat(newDir);
    assert(stat.isDirectory);
  });
});

Deno.test('BasePlatformHandler - ensureDir rethrows non-AlreadyExists errors', async () => {
  const handler = new TestHandler();

  // Try to create a dir inside a file (will fail with NotADirectory or similar)
  await withTempDir(async (dir) => {
    await writeFixture(dir, 'file.txt', 'content');

    await assertRejects(
      async () => await handler.testEnsureDir(`${dir}/file.txt/subdir`),
      Error,
    );
  });
});
