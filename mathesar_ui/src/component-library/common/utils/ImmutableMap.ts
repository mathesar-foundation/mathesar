export default class ImmutableMap<
  Key extends string | number | boolean | null,
  Value,
> {
  private map: Map<Key, Value>;

  constructor(i: Iterable<[Key, Value]> = []) {
    this.map = new Map(i);
  }

  /**
   * This method exists to allow us to subclass this class and call the
   * constructor of the subclass from within this base class.
   *
   * If there's a way we can use generics to avoid `any` here, we'd love to
   * know.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getNewInstance(...args: any[]): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    return new (this.constructor as any)(...args) as this;
  }

  /**
   * By default, the value supplied here will overwrite any value that is
   * already associated with `key`. Alternatively, if you supply a `mergeValues`
   * function, that function will be used to merge the existing value (provided
   * as the first argument) with the supplied value (provided as the second
   * argument).
   */
  with(
    key: Key,
    value: Value,
    mergeValues: (a: Value, b: Value) => Value = (_, b) => b,
  ): this {
    return this.withEntries([[key, value]], mergeValues);
  }

  /**
   * Merge the entries in this map with entries from a supplied iterable,
   * producing a map that contains entries having all the keys from both.
   *
   * When the same key exists in both this map and the supplied iterable, the
   * resulting value will be produced using the supplied `mergeValues` function.
   * The first argument will be the value from this map, the second argument
   * will be the value from the supplied iterable. If no `mergeValues` function
   * is supplied, the values from the supplied iterable will be used.
   */
  withEntries(
    entries: Iterable<[Key, Value]>,
    mergeValues: (a: Value, b: Value) => Value = (_, b) => b,
  ): this {
    const map = new Map(this.map);
    [...entries].forEach(([key, value]) => {
      const existingValue = this.get(key);
      const newValue =
        existingValue === undefined ? value : mergeValues(existingValue, value);
      map.set(key, newValue);
    });
    return this.getNewInstance(map);
  }

  /**
   * If `key` already exists, its corresponding value will remain. If `key` does
   * not exist, then the value supplied here will be used.
   */
  coalesce(key: Key, value: Value): this {
    return this.has(key) ? this : this.with(key, value);
  }

  /**
   * When the same keys exist in within the entries of this instance and the
   * entries supplied, the values from this instance will be used instead of the
   * values from the supplied entries. This behavior is consistent with the
   * `coalesce` method.
   */
  coalesceEntries(other: Iterable<[Key, Value]>): this {
    const map = new Map(this.map);
    [...other].forEach(([key, value]) => {
      if (!this.has(key)) {
        map.set(key, value);
      }
    });
    return this.getNewInstance(map);
  }

  without(keyOrKeys: Key | Key[]): this {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    const map = new Map(this.map);
    keys.forEach((key) => map.delete(key));
    return this.getNewInstance(map);
  }

  has(key: Key): boolean {
    return this.map.has(key);
  }

  get(key: Key): Value | undefined {
    return this.map.get(key);
  }

  get size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<Key> {
    return this.map.keys();
  }

  values(): IterableIterator<Value> {
    return this.map.values();
  }

  entries(): IterableIterator<[Key, Value]> {
    return this.map.entries();
  }

  mapValues<NewValue>(
    fn: (value: Value) => NewValue,
  ): ImmutableMap<Key, NewValue> {
    return new ImmutableMap(
      [...this.entries()].map(([key, value]) => [key, fn(value)]),
    );
  }

  [Symbol.iterator](): IterableIterator<[Key, Value]> {
    return this.entries();
  }
}
