import { writable, type Readable, type Writable } from 'svelte/store';

function deserialize<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    return undefined;
  }
}

function now() {
  return Date.now();
}

type TimestampedValue<T> = {
  /** ms since UNIX epoch */
  timestamp: number;
  inputHash: string;
  value: T;
};

export class CachedFetchStore<T>
  implements Readable<TimestampedValue<T> | undefined>
{
  /**
   * Optionally, a hash of the input to the fetch function. If the input hash
   * changes, the cache will be invalidated.
   */
  private inputHash = '';

  private cacheKey: string;

  private value: Writable<TimestampedValue<T> | undefined>;

  /** @throws Error if fetch fails */
  private fetch: () => Promise<T>;

  private timeToLiveMs: number;

  private serializeValue: (value: T) => string = JSON.stringify;

  /**
   * This function should not throw any errors. If deserialization fails, the
   * deserializer should return `undefined`.
   */
  private deserializeValue: (value: string) => T | undefined = deserialize;

  private writableLoading: Writable<boolean> = writable(false);

  loading: Readable<boolean> = this.writableLoading;

  constructor(props: {
    inputHash?: string;
    cacheKey: string;
    fetch: () => Promise<T>;
    timeToLiveMs: number;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T | undefined;
  }) {
    if (props.inputHash) {
      this.inputHash = props.inputHash;
    }
    this.value = writable(undefined);
    this.cacheKey = props.cacheKey;
    this.fetch = props.fetch;
    this.timeToLiveMs = props.timeToLiveMs;
    if (props.serialize) {
      this.serializeValue = props.serialize;
    }
    if (props.deserialize) {
      this.deserializeValue = props.deserialize;
    }
    void this.cachedFetch();
  }

  /**
   * To avoid double-JSON-encoding, we serialize the timestamp and the value in
   * the same string, separated by a space. Deserialization is straightforward
   * because we can split on the first space character.
   *
   * @returns undefined if value has never been fetched
   */
  private serialize({
    inputHash,
    timestamp,
    value,
  }: {
    inputHash: string;
    timestamp: number;
    value: T;
  }): string {
    return JSON.stringify({
      inputHash,
      timestamp,
      // `value` gets double-encoded here. I don't love this because storage
      // takes up a tiny bit more space and makes troubleshooting in
      // localStorage more cumbersome, but I think it's the most flexible
      // approach because it allows consumers to define their own serialization
      // and deserialization functions.
      value: this.serializeValue(value),
    });
  }

  private deserialize(serialized: string): TimestampedValue<T> | undefined {
    try {
      const deserialized = JSON.parse(serialized) as TimestampedValue<T>;
      const { inputHash, timestamp, value } = deserialized;
      if (typeof inputHash !== 'string') {
        return undefined;
      }
      if (typeof timestamp !== 'number') {
        return undefined;
      }
      if (typeof value !== 'string') {
        return undefined;
      }
      const deserializedValue = this.deserializeValue(value);
      if (deserializedValue === undefined) {
        return undefined;
      }
      return { inputHash, timestamp, value: deserializedValue };
    } catch (e) {
      return undefined;
    }
  }

  private fetchFromCache():
    | 'no-cache-found'
    | 'cache-too-old'
    | 'hash-change'
    | 'cache-ok' {
    const serialized = localStorage.getItem(this.cacheKey);
    if (serialized === null) {
      return 'no-cache-found';
    }
    const deserialized = this.deserialize(serialized);
    if (deserialized === undefined) {
      return 'no-cache-found';
    }
    if (now() - deserialized.timestamp > this.timeToLiveMs) {
      return 'cache-too-old';
    }
    if (deserialized.inputHash !== this.inputHash) {
      return 'hash-change';
    }
    this.value.set(deserialized);
    return 'cache-ok';
  }

  /**
   * @throws Errors from `fetch` function
   */
  async forceFetch() {
    try {
      this.writableLoading.set(true);
      const timestamp = now();
      const value = await this.fetch();
      const { inputHash } = this;
      localStorage.setItem(
        this.cacheKey,
        this.serialize({ inputHash, timestamp, value }),
      );
      this.value.set({ inputHash, timestamp, value });
    } finally {
      this.writableLoading.set(false);
    }
  }

  private async cachedFetch() {
    const cacheStatus = this.fetchFromCache();
    if (cacheStatus === 'cache-ok') {
      return;
    }
    try {
      await this.forceFetch();
    } catch (e) {
      // Ignore errors. We only care about catching them when force-fetching.
    }
  }

  subscribe(run: (value: TimestampedValue<T> | undefined) => void) {
    return this.value.subscribe(run);
  }
}
