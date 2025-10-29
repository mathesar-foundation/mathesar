export class BidirectionalMap<K, V> {
  private keyToValue = new Map<K, V>();

  private valueToKey = new Map<V, K>();

  constructor(entries: Iterable<[K, V]> = []) {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  set(key: K, value: V): void {
    // Remove old mappings if they exist to maintain bijection
    const oldValue = this.keyToValue.get(key);
    if (oldValue !== undefined) {
      this.valueToKey.delete(oldValue);
    }

    const oldKey = this.valueToKey.get(value);
    if (oldKey !== undefined) {
      this.keyToValue.delete(oldKey);
    }

    // Set new mappings
    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
  }

  getValue(key: K): V | undefined {
    return this.keyToValue.get(key);
  }

  getKey(value: V): K | undefined {
    return this.valueToKey.get(value);
  }

  deleteKey(key: K): boolean {
    const value = this.keyToValue.get(key);
    if (value === undefined) return false;
    this.keyToValue.delete(key);
    this.valueToKey.delete(value);
    return true;
  }

  deleteValue(value: V): boolean {
    const key = this.valueToKey.get(value);
    if (key === undefined) return false;
    this.valueToKey.delete(value);
    this.keyToValue.delete(key);
    return true;
  }

  hasKey(key: K): boolean {
    return this.keyToValue.has(key);
  }

  hasValue(value: V): boolean {
    return this.valueToKey.has(value);
  }

  clear(): void {
    this.keyToValue.clear();
    this.valueToKey.clear();
  }

  get size(): number {
    return this.keyToValue.size;
  }

  keys(): IterableIterator<K> {
    return this.keyToValue.keys();
  }

  values(): IterableIterator<V> {
    return this.keyToValue.values();
  }
}
