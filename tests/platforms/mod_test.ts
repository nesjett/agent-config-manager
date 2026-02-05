import { assert, assertEquals } from '@std/assert';
import {
  ClaudeHandler,
  CopilotHandler,
  CursorHandler,
  detectPlatforms,
  getAllPlatformHandlers,
  getPlatformHandler,
  getSupportedPlatforms,
  WindsurfHandler,
} from '../../src/platforms/mod.ts';
import { withTempDir, writeFixture } from '../_test_helpers.ts';

Deno.test('getPlatformHandler returns handler for "cursor"', () => {
  const handler = getPlatformHandler('cursor');
  assert(handler instanceof CursorHandler);
});

Deno.test('getPlatformHandler returns handler for "claude"', () => {
  const handler = getPlatformHandler('claude');
  assert(handler instanceof ClaudeHandler);
});

Deno.test('getPlatformHandler returns handler for "copilot"', () => {
  const handler = getPlatformHandler('copilot');
  assert(handler instanceof CopilotHandler);
});

Deno.test('getPlatformHandler returns handler for "windsurf"', () => {
  const handler = getPlatformHandler('windsurf');
  assert(handler instanceof WindsurfHandler);
});

Deno.test('getPlatformHandler returns undefined for unknown platform', () => {
  const handler = getPlatformHandler('unknown' as never);
  assertEquals(handler, undefined);
});

Deno.test('getAllPlatformHandlers returns all 4 handlers', () => {
  const handlers = getAllPlatformHandlers();
  assertEquals(handlers.length, 4);
  assert(handlers.every((h) => h.detect !== undefined));
});

Deno.test('getSupportedPlatforms returns all platform names', () => {
  const platforms = getSupportedPlatforms();
  assertEquals(platforms.length, 4);
  assert(platforms.includes('cursor'));
  assert(platforms.includes('claude'));
  assert(platforms.includes('copilot'));
  assert(platforms.includes('windsurf'));
});

Deno.test('detectPlatforms returns empty when none detected', async () => {
  await withTempDir(async () => {
    const detected = await detectPlatforms();
    assertEquals(detected, []);
  });
});

Deno.test('detectPlatforms returns detected platforms', async () => {
  await withTempDir(async (dir) => {
    // Create .cursor directory and CLAUDE.md
    await Deno.mkdir(`${dir}/.cursor`);
    await writeFixture(dir, 'CLAUDE.md', 'test');

    const detected = await detectPlatforms();
    assert(detected.includes('cursor'));
    assert(detected.includes('claude'));
  });
});
