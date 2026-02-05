import { assertEquals, assertStringIncludes } from '@std/assert';
import { assertSpyCalls, spy } from '@std/testing/mock';
import { colors, log } from '../../src/utils/colors.ts';

// Test each color function
Deno.test('colors.red returns string', () => {
  const result = colors.red('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.green returns string', () => {
  const result = colors.green('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.yellow returns string', () => {
  const result = colors.yellow('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.blue returns string', () => {
  const result = colors.blue('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.magenta returns string', () => {
  const result = colors.magenta('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.cyan returns string', () => {
  const result = colors.cyan('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.white returns string', () => {
  const result = colors.white('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.gray returns string', () => {
  const result = colors.gray('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.bold returns string', () => {
  const result = colors.bold('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.dim returns string', () => {
  const result = colors.dim('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.italic returns string', () => {
  const result = colors.italic('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

Deno.test('colors.underline returns string', () => {
  const result = colors.underline('test');
  assertEquals(typeof result, 'string');
  assertStringIncludes(result, 'test');
});

// Test log functions
Deno.test('log.info calls console.log with blue icon', () => {
  const logSpy = spy(console, 'log');
  try {
    log.info('test message');
    assertSpyCalls(logSpy, 1);
    assertStringIncludes(String(logSpy.calls[0].args[1]), 'test message');
  } finally {
    logSpy.restore();
  }
});

Deno.test('log.success calls console.log with green icon', () => {
  const logSpy = spy(console, 'log');
  try {
    log.success('success message');
    assertSpyCalls(logSpy, 1);
    assertStringIncludes(String(logSpy.calls[0].args[1]), 'success message');
  } finally {
    logSpy.restore();
  }
});

Deno.test('log.warn calls console.log with yellow icon', () => {
  const logSpy = spy(console, 'log');
  try {
    log.warn('warning message');
    assertSpyCalls(logSpy, 1);
    assertStringIncludes(String(logSpy.calls[0].args[1]), 'warning message');
  } finally {
    logSpy.restore();
  }
});

Deno.test('log.error calls console.error with red icon', () => {
  const errorSpy = spy(console, 'error');
  try {
    log.error('error message');
    assertSpyCalls(errorSpy, 1);
    assertStringIncludes(String(errorSpy.calls[0].args[1]), 'error message');
  } finally {
    errorSpy.restore();
  }
});

Deno.test('log.debug calls console.log with gray icon and message', () => {
  const logSpy = spy(console, 'log');
  try {
    log.debug('debug message');
    assertSpyCalls(logSpy, 1);
    assertStringIncludes(String(logSpy.calls[0].args[1]), 'debug message');
  } finally {
    logSpy.restore();
  }
});
