import { getContext, setContext } from 'svelte';
import { type Readable, type Writable, writable } from 'svelte/store';

export function setRouteContext<T>(
  contextKey: unknown,
  object: T,
): Readable<T> {
  let store = getContext<Writable<T>>(contextKey);
  if (store !== undefined) {
    store.set(object);
    return store;
  }
  store = writable(object);
  setContext(contextKey, store);
  return store;
}

export function getRouteContext<T>(contextKey: unknown): Readable<T> {
  const store = getContext<Writable<T>>(contextKey);
  if (store === undefined) {
    throw new Error('Route context has not been set');
  }
  return store;
}

export function makeContext<T>() {
  const key = {};
  return {
    set: (value: T) => setContext(key, value),
    get: () => getContext<T | undefined>(key),
    getOrError: () => {
      const value = getContext<T | undefined>(key);
      if (value === undefined) {
        throw new Error('Value not found in context');
      }
      return value as T;
    },
  };
}
