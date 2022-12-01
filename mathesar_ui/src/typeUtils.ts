export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export interface ReadableMapLike<Key, Value> {
  size: number;
  get: (key: Key) => Value | undefined;
  keys(): IterableIterator<Key>;
  values(): IterableIterator<Value>;
}
