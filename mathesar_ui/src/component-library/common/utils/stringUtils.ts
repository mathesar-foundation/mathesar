/**
 * From https://stackoverflow.com/a/3561711/895563
 */
export function escapeRegex(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
