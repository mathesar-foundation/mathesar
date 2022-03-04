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
   * The value supplied here will overwrite any value that is already associated
   * with `key`.
   */
  with(key: Key, value: Value): this {
    const map = new Map(this.map);
    map.set(key, value);
    return this.getNewInstance(map);
  }

  /**
   * When the same keys exist in within the entries of this instance and the
   * entries supplied, the values from the entries supplied will be used instead
   * of the values in this instance. This behavior is consistent with the `with`
   * method.
   */
  withEntries(entries: Iterable<[Key, Value]>): this {
    const map = new Map(this.map);
    [...entries].forEach(([key, value]) => {
      map.set(key, value);
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

  without(key: Key): this {
    const map = new Map(this.map);
    map.delete(key);
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

  [Symbol.iterator](): IterableIterator<[Key, Value]> {
    return this.entries();
  }
}
