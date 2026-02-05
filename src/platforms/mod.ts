import type { Platform, PlatformHandler } from '../types.ts';
import { ClaudeHandler } from './claude.ts';
import { CopilotHandler } from './copilot.ts';
import { CursorHandler } from './cursor.ts';
import { WindsurfHandler } from './windsurf.ts';

/**
 * Registry of all platform handlers
 */
const handlers = new Map<Platform, PlatformHandler>();
handlers.set('cursor', new CursorHandler());
handlers.set('claude', new ClaudeHandler());
handlers.set('copilot', new CopilotHandler());
handlers.set('windsurf', new WindsurfHandler());

/**
 * Get a platform handler by name
 */
export function getPlatformHandler(
  platform: Platform,
): PlatformHandler | undefined {
  return handlers.get(platform);
}

/**
 * Get all registered platform handlers
 */
export function getAllPlatformHandlers(): PlatformHandler[] {
  return Array.from(handlers.values());
}

/**
 * Get list of supported platform names
 */
export function getSupportedPlatforms(): Platform[] {
  return Array.from(handlers.keys());
}

/**
 * Detect which platforms are configured in the current directory
 */
export async function detectPlatforms(): Promise<Platform[]> {
  const detected: Platform[] = [];

  for (const [platform, handler] of handlers) {
    if (await handler.detect()) {
      detected.push(platform);
    }
  }

  return detected;
}

export { ClaudeHandler, CopilotHandler, CursorHandler, WindsurfHandler };
