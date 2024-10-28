import { defined } from '@mathesar/component-library';

/**
 * Use this function to generate unique keys for use with svelte's {#each} block
 * even when you have items that may contain duplicates.
 *
 * ## Example
 *
 * ```svelte
 * {#each makeUniqueKeys(items) as [item, key], (key)}
 *   <Item {item} />
 * {/each}
 */
export function* makeUniqueKeys<T>(
  values: Iterable<T>,
  keyFn?: (value: T) => string,
): Iterable<[T, string]> {
  const makeKey = keyFn ?? JSON.stringify;
  const keys = new Map<string, number>();
  for (const value of values) {
    const key = makeKey(value);
    /** The index of this key occurring within the values */
    const keyIndex = defined(keys.get(key), (i) => i + 1) ?? 0;
    keys.set(key, keyIndex);
    const uniqueKey = `${key}-${keyIndex}`;
    yield [value, uniqueKey];
  }
}
