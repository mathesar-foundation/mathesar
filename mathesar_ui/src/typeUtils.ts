export interface ReadableMapLike<Key, Value> {
  size: number;
  get: (key: Key) => Value | undefined;
  keys(): IterableIterator<Key>;
  values(): IterableIterator<Value>;
}
