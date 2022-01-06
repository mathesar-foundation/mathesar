export class ImmutableSet<T extends string | number | boolean | null> {
  private set: Set<T>;

  constructor(i?: Iterable<T>) {
    this.set = new Set(i);
  }

  with(item: T): ImmutableSet<T> {
    const set = new Set(this.set);
    set.add(item);
    return new ImmutableSet(set);
  }

  without(item: T): ImmutableSet<T> {
    const set = new Set(this.set);
    set.delete(item);
    return new ImmutableSet(set);
  }

  has(item: T): boolean {
    return this.set.has(item);
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
}
