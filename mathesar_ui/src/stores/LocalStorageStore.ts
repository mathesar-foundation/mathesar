import {
  type Subscriber,
  type Unsubscriber,
  type Writable,
  writable,
} from 'svelte/store';

interface Props<T> {
  key: string;
  /**
   * The initial value to be used for the store if no value is found in
   * localStorage
   */
  defaultValue: T;
  /** Defaults to `JSON.stringify` */
  serialize?: (value: T) => string;
  /** Defaults to `JSON.parse` */
  deserialize?: (value: string) => T;
}

export default class LocalStorageStore<T> implements Writable<T> {
  private store: Writable<T>;

  private key: string;

  private defaultValue: T;

  private serialize: (value: T) => string;

  /** @throws Error if deserialization fails */
  private deserialize: (value: string) => T;

  constructor(props: Props<T>) {
    this.key = props.key;
    this.defaultValue = props.defaultValue;
    this.serialize = props.serialize ?? JSON.stringify;
    this.deserialize = props.deserialize ?? JSON.parse;
    this.store = writable(this.getLocalStorageValue());
  }

  private getLocalStorageValue(): T {
    const value = localStorage.getItem(this.key);
    if (value === null) {
      return this.defaultValue;
    }
    try {
      return this.deserialize(value);
    } catch {
      return this.defaultValue;
    }
  }

  private setLocalStorageValue(value: T): void {
    localStorage.setItem(this.key, this.serialize(value));
  }

  subscribe(
    run: Subscriber<T>,
    invalidate?: ((value?: T | undefined) => void) | undefined,
  ): Unsubscriber {
    return this.store.subscribe(run, invalidate);
  }

  set(value: T): void {
    this.store.set(value);
    this.setLocalStorageValue(value);
  }

  update(updater: (value: T) => T): void {
    this.store.update((previousValue) => {
      const newValue = updater(previousValue);
      this.setLocalStorageValue(newValue);
      return newValue;
    });
  }
}
