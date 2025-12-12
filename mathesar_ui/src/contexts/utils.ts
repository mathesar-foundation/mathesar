import { getContext, setContext } from 'svelte';
import { type Readable, type Writable, writable } from 'svelte/store';

import { ensureReadable } from '@mathesar-component-library';

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

export function getSafeRouteContext<T>(
  contextKey: unknown,
): Readable<T | undefined> {
  return ensureReadable(getContext<Writable<T | undefined>>(contextKey));
}
