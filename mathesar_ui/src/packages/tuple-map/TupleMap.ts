import { map } from 'iter-tools';

function parse<T>(key: string): T {
  return JSON.parse(key) as T;
}

function serialize(keys: unknown[]): string {
  return JSON.stringify(keys);
}

export class TupleMap<K extends unknown[], V> {
  private map = new Map<string, V>();

  set(key: K, value: V) {
    this.map.set(serialize(key), value);
  }

  get(key: K): V | undefined {
    return this.map.get(serialize(key));
  }

  has(key: K): boolean {
    return this.map.has(serialize(key));
  }

  delete(key: K): boolean {
    return this.map.delete(serialize(key));
  }

  clear() {
    this.map.clear();
  }

  forEach(fn: (value: V, key: K, map: TupleMap<K, V>) => void) {
    this.map.forEach((value, key) => fn(value, parse(key), this));
  }

  get size() {
    return this.map.size;
  }

  keys(): IterableIterator<K> {
    return map((k) => parse(k), this.map.keys());
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return map(([key, value]) => [parse(key), value], this.map.entries());
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
