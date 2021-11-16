import { readable, Readable } from 'svelte/store';

export function isReadable<T>(v: Readable<T> | T): v is Readable<T> {
  return typeof v === 'object' && 'subscribe' in v && typeof v.subscribe === 'function';
}

export function ensureReadable<T>(v: Readable<T> | T): Readable<T> {
  if (isReadable(v)) {
    return v;
  }
  return readable(v);
}
