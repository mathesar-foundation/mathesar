import ImmutableMap from './ImmutableMap';

export default class SortedImmutableMap<Key, Value> extends ImmutableMap<
  Key,
  Value
> {
  sortFn;

  constructor(
    sortFn: (j: Iterable<[Key, Value]>) => Iterable<[Key, Value]>,
    i: Iterable<[Key, Value]> = [],
  ) {
    const sorted = sortFn(i);
    super(sorted);
    this.sortFn = sortFn;
  }

  protected getNewInstance(...args: any[]): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    return new (this.constructor as any)(this.sortFn, ...args) as this;
  }
}
