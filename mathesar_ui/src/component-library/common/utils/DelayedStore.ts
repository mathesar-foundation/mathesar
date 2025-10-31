import { type Readable, type Writable, writable } from 'svelte/store';

export class DelayedStore<T> implements Readable<T> {
  private delay: number;

  private value: Writable<T>;

  private cancel?: () => void;

  constructor(initialValue: T, delayMs: number) {
    this.delay = delayMs;
    this.value = writable(initialValue);
  }

  subscribe(run: (value: T) => void): () => void {
    return this.value.subscribe(run);
  }

  setImmediately(value: T) {
    this.cancel?.();
    this.value.set(value);
  }

  setAfterDelay(value: T) {
    this.cancel?.();
    const timeoutId = window.setTimeout(() => {
      this.value.set(value);
    }, this.delay);
    this.cancel = () => {
      window.clearTimeout(timeoutId);
    };
  }
}
