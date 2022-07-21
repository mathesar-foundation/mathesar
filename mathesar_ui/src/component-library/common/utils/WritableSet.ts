import type {
  Subscriber,
  Unsubscriber,
  Writable,
  Readable,
} from 'svelte/store';
import { writable, get, derived } from 'svelte/store';
import ImmutableSet from './ImmutableSet';

export default class WritableSet<Value extends string | number | boolean | null>
  implements Readable<ImmutableSet<Value>>
{
  values: Writable<ImmutableSet<Value>>;

  constructor(i: Iterable<Value> = []) {
    this.values = writable(new ImmutableSet(i));
  }

  subscribe(run: Subscriber<ImmutableSet<Value>>): Unsubscriber {
    return this.values.subscribe(run);
  }

  reconstruct(i: Iterable<Value> = []): void {
    this.values.set(new ImmutableSet(i));
  }

  clear(): void {
    this.values.set(new ImmutableSet());
  }

  delete(valueOrValues: Value | Value[]): void {
    this.values.update((set) => set.without(valueOrValues));
  }

  add(value: Value): void {
    this.values.update((set) => set.with(value));
  }

  addMultiple(i: Iterable<Value> = []): void {
    this.values.update((set) => set.union(i));
  }

  getValues(): IterableIterator<Value> {
    return get(this.values).values();
  }

  derivedValues(): Readable<IterableIterator<Value>> {
    return derived(this.values, (s) => s.values());
  }

  getHas(value: Value): boolean {
    return get(this.values).has(value);
  }

  derivedHas(value: Value): Readable<boolean> {
    return derived(this.values, (s) => s.has(value));
  }
}
