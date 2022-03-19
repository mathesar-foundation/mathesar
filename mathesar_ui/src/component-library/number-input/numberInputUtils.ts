/**
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
 */
export function getInputMode({
  allowFloat,
  allowNegative,
}: {
  allowFloat: boolean;
  allowNegative: boolean;
}): 'text' | 'numeric' | 'decimal' {
  if (allowNegative) {
    // Because some devices may not have a minus sign
    return 'text';
  }
  return allowFloat ? 'decimal' : 'numeric';
}
