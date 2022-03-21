import { defaultOptions } from './number-formatter';
import type { NumberFormatterOptions } from './number-formatter/types';

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
 */
export function getInputMode(
  opts: Partial<NumberFormatterOptions>,
): 'text' | 'numeric' | 'decimal' {
  const fullOpts = { ...defaultOptions, ...opts };
  const { allowFloat, allowNegative } = fullOpts;
  if (allowNegative) {
    // Because some devices may not have a minus sign
    return 'text';
  }
  return allowFloat ? 'decimal' : 'numeric';
}
