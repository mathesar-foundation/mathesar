export interface ReadableMapLike<Key, Value> {
  size: number;
  get: (key: Key) => Value | undefined;
  keys(): IterableIterator<Key>;
  values(): IterableIterator<Value>;
}

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];
