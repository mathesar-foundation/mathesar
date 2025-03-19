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

export function* filterViaTextQuery<I>(
  items: Iterable<I>,
  query: string | undefined | null,
  getStringRepresentation: (item: I) => string | string[],
): Generator<I, void, undefined> {
  if (query === undefined || query === null || query.trim() === '') {
    yield* items;
    return;
  }

  function normalize(s: string) {
    return toAsciiLowerCase(s.trim());
  }

  const normalizedQuery = normalize(query);

  for (const item of items) {
    const s = getStringRepresentation(item);
    const stringRepresentations = Array.isArray(s) ? s : [s];
    const isMatch = stringRepresentations.some((itemText) =>
      normalize(itemText).includes(normalizedQuery),
    );
    if (isMatch) yield item;
  }
}
