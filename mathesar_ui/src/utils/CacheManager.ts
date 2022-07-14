export default class CacheManager<Key, Value> {
  maxEntries = 5;

  cache: Map<Key, Value>;

  constructor(maxEntries: number, initialValues?: Map<Key, Value>) {
    this.maxEntries = maxEntries;
    this.cache = new Map(initialValues);
  }

  set(key: Key, value: Value): void {
    // We're deleting existing entry to change order of storage
    this.cache.delete(key);
    this.cache.set(key, value);

    if (this.cache.size > this.maxEntries) {
      this.cache.delete([...this.cache.keys()][0]);
    }
  }

  get(key: Key): Value | undefined {
    return this.cache.get(key);
  }
}
