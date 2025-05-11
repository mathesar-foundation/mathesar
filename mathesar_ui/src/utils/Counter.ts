import { every } from 'iter-tools';

/**
 * Counts the number of occurrences of items.
 *
 * (Inspired by the python [Counter][1] collection, but made to be immutable.)
 *
 * [1]: https://docs.python.org/3/library/collections.html#collections.Counter
 */
export class Counter<T extends string | number> {
  private map: Map<T, number>;

  constructor(iterable: Iterable<T>) {
    const map = new Map<T, number>();
    for (const item of iterable) {
      map.set(item, (map.get(item) ?? 0) + 1);
    }
    this.map = map;
  }

  /** Returns the count of the given item. */
  get(item: T): number {
    return this.map.get(item) ?? 0;
  }

  /**
   * @returns true if this counter only contains items within the supplied
   * iterable.
   */
  isSubsetOf(items: T[]): boolean {
    return every((k) => items.includes(k), this.map.keys());
  }

  get distinctValues(): number {
    return this.map.size;
  }
}
