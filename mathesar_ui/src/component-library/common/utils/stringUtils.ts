/**
 * From https://stackoverflow.com/a/3561711/895563
 */
export function escapeRegex(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/** From https://stackoverflow.com/a/49901740/895563 */
export function transliterateToAscii(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function toAsciiLowerCase(input: string): string {
  return transliterateToAscii(input).toLowerCase();
}
