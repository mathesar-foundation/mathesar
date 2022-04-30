import type {
  Subscriber,
  Unsubscriber,
  Writable,
  Readable,
} from 'svelte/store';
import { writable, get, derived } from 'svelte/store';
import ImmutableMap from './ImmutableMap';

export default class WritableMap<
  Key extends string | number | boolean | null,
  Value,
> implements Readable<ImmutableMap<Key, Value>>
{
  map: Writable<ImmutableMap<Key, Value>>;

  constructor(i: Iterable<[Key, Value]> = []) {
    this.map = writable(new ImmutableMap(i));
  }

  subscribe(run: Subscriber<ImmutableMap<Key, Value>>): Unsubscriber {
    return this.map.subscribe(run);
  }

  reconstruct(i: Iterable<[Key, Value]> = []): void {
    this.map.set(new ImmutableMap(i));
  }

  clear(): void {
    this.map.set(new ImmutableMap());
  }

  delete(keyOrKeys: Key | Key[]): void {
    this.map.update((m) => m.without(keyOrKeys));
  }

  set(
    key: Key,
    value: Value,
    mergeValues: (a: Value, b: Value) => Value = (_, b) => b,
  ): void {
    this.map.update((m) => m.with(key, value, mergeValues));
  }

  setEntries(
    i: Iterable<[Key, Value]> = [],
    mergeValues: (a: Value, b: Value) => Value = (_, b) => b,
  ): void {
    this.map.update((m) => m.withEntries(i, mergeValues));
  }

  /**
   * Sets many keys to the same value.
   */
  setMultiple(
    i: Iterable<Key>,
    value: Value,
    mergeValues: (a: Value, b: Value) => Value = (_, b) => b,
  ): void {
    this.map.update((m) =>
      m.withEntries(
        [...i].map((key) => [key, value]),
        mergeValues,
      ),
    );
  }

  getEntries(): IterableIterator<[Key, Value]> {
    return get(this.map).entries();
  }

  derivedEntries(): Readable<IterableIterator<[Key, Value]>> {
    return derived(this.map, (m) => m.entries());
  }

  getHas(key: Key): boolean {
    return get(this.map).has(key);
  }

  derivedHas(key: Key): Readable<boolean> {
    return derived(this.map, (m) => m.has(key));
  }

  getValue(key: Key): Value | undefined {
    return get(this.map).get(key);
  }

  derivedValue(key: Key): Readable<Value | undefined> {
    return derived(this.map, (m) => m.get(key));
  }

  getKeys(): IterableIterator<Key> {
    return get(this.map).keys();
  }

  derivedKeys(): Readable<IterableIterator<Key>> {
    return derived(this.map, (m) => m.keys());
  }

  getValues(): IterableIterator<Value> {
    return get(this.map).values();
  }

  derivedValues(): Readable<IterableIterator<Value>> {
    return derived(this.map, (m) => m.values());
  }
}
