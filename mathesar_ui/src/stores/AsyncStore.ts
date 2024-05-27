/* eslint-disable max-classes-per-file */

import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  type Writable,
  get,
  writable,
} from 'svelte/store';

import { getErrorMessage } from '@mathesar/utils/errors';
import type { CancellablePromise } from '@mathesar-component-library';

export type AsyncStoreSettlement<T, E> =
  | { state: 'resolved'; value: T }
  | { state: 'rejected'; error: E };

export class AsyncStoreValue<T, E> {
  /**
   * This is the most recently settled value. It can be present even while the
   * async store is loading because the store might be reloading.
   */
  readonly settlement?: AsyncStoreSettlement<T, E>;

  readonly isLoading: boolean;

  constructor({
    isLoading,
    settlement,
  }: {
    isLoading: boolean;
    settlement?: AsyncStoreSettlement<T, E>;
  }) {
    this.isLoading = isLoading;
    this.settlement = settlement;
  }

  /**
   * Only true during the first load. False during reloads.
   */
  get isInitializing(): boolean {
    return this.isLoading && this.settlement === undefined;
  }

  /**
   * Only true during reloads. False during the first load.
   */
  get isReloading(): boolean {
    return this.isLoading && this.settlement !== undefined;
  }

  /**
   * True when the async store is resolved and not reloading.
   */
  get isOk(): boolean {
    return !this.isLoading && this.settlement?.state === 'resolved';
  }

  /**
   * True when nothing is happening that would prevent a user from moving on to
   * the next step in a multi-step process.
   *
   * The AsyncStore begins in a stable state before it is run. It becomes
   * unstable while it is initializing, while it is reloading, or when it has an
   * error.
   */
  get isStable(): boolean {
    if (this.isLoading) {
      return false;
    }
    if (this.settlement?.state === 'rejected') {
      return false;
    }
    return true;
  }

  get resolvedValue(): T | undefined {
    return this.settlement?.state === 'resolved'
      ? this.settlement.value
      : undefined;
  }

  get error(): E | undefined {
    return this.settlement?.state === 'rejected'
      ? this.settlement.error
      : undefined;
  }

  get isRejected(): boolean {
    return !this.isLoading && this.settlement?.state === 'rejected';
  }

  get hasInitialized(): boolean {
    return this.settlement !== undefined;
  }
}

export default class AsyncStore<Props, T>
  implements Readable<AsyncStoreValue<T, string>>
{
  private runFn: (props: Props) => Promise<T> | CancellablePromise<T>;

  private getError: (caughtValue: unknown) => string;

  private value: Writable<AsyncStoreValue<T, string>> = writable(
    new AsyncStoreValue({ isLoading: false }),
  );

  private promise: Promise<T> | CancellablePromise<T> | undefined = undefined;

  constructor(
    run: (props: Props) => Promise<T> | CancellablePromise<T>,
    getError: (caughtValue: unknown) => string = getErrorMessage,
  ) {
    this.runFn = run;
    this.getError = getError;
  }

  subscribe(
    run: Subscriber<AsyncStoreValue<T, string>>,
    invalidate?:
      | ((value?: AsyncStoreValue<T, string> | undefined) => void)
      | undefined,
  ): Unsubscriber {
    return this.value.subscribe(run, invalidate);
  }

  async run(props: Props): Promise<AsyncStoreValue<T, string>> {
    this.cancel();
    this.value.update((v) => new AsyncStoreValue({ ...v, isLoading: true }));
    this.promise = this.runFn(props);
    try {
      this.value.set(
        new AsyncStoreValue({
          settlement: { state: 'resolved', value: await this.promise },
          isLoading: false,
        }),
      );
      return get(this.value);
    } catch (error) {
      this.value.set(
        new AsyncStoreValue({
          settlement: { state: 'rejected', error: this.getError(error) },
          isLoading: false,
        }),
      );
      return get(this.value);
    }
  }

  /**
   * Cancels the promise, if possible. Retains the current value.
   */
  cancel() {
    if (this.promise && 'cancel' in this.promise) {
      this.promise.cancel();
    }
  }

  /**
   * Resets the store to its initial state before it has been run.
   */
  reset() {
    this.cancel();
    this.value.set(new AsyncStoreValue({ isLoading: false }));
  }
}

/* eslint-enable max-classes-per-file */
