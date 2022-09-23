import type { Readable } from 'svelte/store';
import { readable, derived } from 'svelte/store';

export function isReadable<T>(v: Readable<T> | T): v is Readable<T> {
  return (
    typeof v === 'object' &&
    v !== null &&
    'subscribe' in v &&
    typeof v.subscribe === 'function'
  );
}

export function ensureReadable<T>(v: Readable<T> | T): Readable<T> {
  if (isReadable(v)) {
    return v;
  }
  return readable(v);
}

/**
 * Collapse two nested stores into a single store.
 */
export function collapse<T>(outerStore: Readable<Readable<T>>): Readable<T> {
  // This is memory-safe because the Unsubscriber function gets returned from
  // the callback passed to `derive`.
  //
  // From https://svelte.dev/docs#run-time-svelte-store-derived
  //
  // > If you return a function from the callback, it will be called when a) the
  // > callback runs again, or b) the last subscriber unsubscribes.
  return derived(outerStore, (innerStore, set) => innerStore.subscribe(set));
}

function arrayWithValueSetAtIndex<T>(array: T[], index: number, item: T): T[] {
  const result = [...array];
  result[index] = item;
  return result;
}

/**
 * Unite an array of stores into a store of arrays.
 */
export function unite<T>(stores: Readable<T>[]): Readable<T[]> {
  let results: T[] = [];
  return readable(results, (set) => {
    const unsubscribers = stores.map((store, index) =>
      store.subscribe((value) => {
        results = arrayWithValueSetAtIndex(results, index, value);
        set(results);
      }),
    );
    // This is memory safe because when the last subscriber unsubscribes from
    // the `unite` store, the function below will ensure that we're
    // unsubscribing from all the inner stores.
    return () => unsubscribers.forEach((unsubscriber) => unsubscriber());
  });
}
