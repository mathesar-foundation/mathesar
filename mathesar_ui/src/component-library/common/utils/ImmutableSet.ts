export default class ImmutableSet<T> {
  private set: Set<T>;

  constructor(i?: Iterable<T>) {
    this.set = new Set(i);
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

  with(item: T): this {
    const set = new Set(this.set);
    set.add(item);
    return this.getNewInstance(set);
  }

  union(other: Iterable<T>): this {
    const set = new Set(this.set);
    [...other].forEach((value) => {
      set.add(value);
    });
    return this.getNewInstance(set);
  }

  /**
   * @returns a new ImmutableSet that contains only the items that are present
   * in both this set and the other set. The order of the items in the returned
   * set is taken from this set (not the supplied set).
   */
  intersect(other: { has: (v: T) => boolean }): this {
    return this.getNewInstance([...this].filter((v) => other.has(v)));
  }

  without(itemOrItems: T | T[]): this {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    const set = new Set(this.set);
    items.forEach((item) => {
      set.delete(item);
    });
    return this.getNewInstance(set);
  }

  has(item: T): boolean {
    return this.set.has(item);
  }

  equals(other: Iterable<T> & { size: number }): boolean {
    return this.size === other.size && this.union(other).size === this.size;
  }

  get size(): number {
    return this.set.size;
  }

  values(): IterableIterator<T> {
    return this.set.values();
  }

  valuesArray(): T[] {
    return [...this.set.values()];
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values();
  }
}
