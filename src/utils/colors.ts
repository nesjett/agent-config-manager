/**
 * Terminal color utilities for CLI output
 */

const isColorSupported = Deno.stdout.isTerminal();

const colorize = (code: number, text: string): string => {
  if (!isColorSupported) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
};

export const colors = {
  // Text colors
  red: (text: string) => colorize(31, text),
  green: (text: string) => colorize(32, text),
  yellow: (text: string) => colorize(33, text),
  blue: (text: string) => colorize(34, text),
  magenta: (text: string) => colorize(35, text),
  cyan: (text: string) => colorize(36, text),
  white: (text: string) => colorize(37, text),
  gray: (text: string) => colorize(90, text),

  // Styles
  bold: (text: string) => colorize(1, text),
  dim: (text: string) => colorize(2, text),
  italic: (text: string) => colorize(3, text),
  underline: (text: string) => colorize(4, text),
};

export const log = {
  info: (msg: string) => console.log(colors.blue('ℹ'), msg),
  success: (msg: string) => console.log(colors.green('✓'), msg),
  warn: (msg: string) => console.log(colors.yellow('⚠'), msg),
  error: (msg: string) => console.error(colors.red('✗'), msg),
  debug: (msg: string) => console.log(colors.gray('⋯'), colors.gray(msg)),
};
