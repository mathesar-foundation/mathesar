import { getContext, setContext } from 'svelte';

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
