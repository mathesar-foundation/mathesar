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
import {
  type CancellablePromise,
  hasProperty,
} from '@mathesar-component-library';

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

export default class AsyncStore<Props = void, T = unknown>
  implements Readable<AsyncStoreValue<T, string>>
{
  private runFn: (props: Props) => Promise<T> | CancellablePromise<T>;

  private getError: (caughtValue: unknown) => string;

  protected value: Writable<AsyncStoreValue<T, string>> = writable(
    new AsyncStoreValue({ isLoading: false }),
  );

  private promise: Promise<T> | CancellablePromise<T> | undefined = undefined;

  constructor(
    run: (props: Props) => Promise<T> | CancellablePromise<T>,
    options?: Partial<{
      getError: (caughtValue: unknown) => string;
      initialValue: T;
    }>,
  ) {
    this.runFn = run;
    this.getError = options?.getError ?? getErrorMessage;
    if (hasProperty(options, 'initialValue')) {
      this.value = writable(
        new AsyncStoreValue<T, string>({
          isLoading: false,
          settlement: { state: 'resolved', value: options.initialValue as T },
        }),
      );
    }
  }

  subscribe(
    subscriber: Subscriber<AsyncStoreValue<T, string>>,
    invalidate?:
      | ((value?: AsyncStoreValue<T, string> | undefined) => void)
      | undefined,
  ): Unsubscriber {
    return this.value.subscribe(subscriber, invalidate);
  }

  async run(props: Props): Promise<AsyncStoreValue<T, string>> {
    this.beforeRun();
    this.promise = this.runFn(props);
    try {
      this.setResolvedValue(await this.promise);
      return get(this.value);
    } catch (error) {
      this.setRejectedError(error);
      return get(this.value);
    }
  }

  /**
   * Only runs if the current value is one of
   * - not initialized
   * - rejected
   * - not loading
   */
  async runOptimally(props: Props): Promise<AsyncStoreValue<T, string>> {
    const value = get(this.value);
    if (value.isLoading || value.isOk) {
      return value;
    }
    return this.run(props);
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

  updateResolvedValue(updater: (resolvedValue: T) => T) {
    const value = get(this.value);
    if (value.isOk && value.resolvedValue) {
      const updatedValue = updater(value.resolvedValue);
      this.setResolvedValue(updatedValue);
    }
  }

  protected beforeRun() {
    this.cancel();
    this.value.update((v) => new AsyncStoreValue({ ...v, isLoading: true }));
  }

  protected setResolvedValue(value: T) {
    this.cancel();
    this.value.set(
      new AsyncStoreValue({
        isLoading: false,
        settlement: { state: 'resolved', value },
      }),
    );
  }

  protected setRejectedError(error: unknown) {
    this.cancel();
    this.value.set(
      new AsyncStoreValue({
        settlement: { state: 'rejected', error: this.getError(error) },
        isLoading: false,
      }),
    );
  }
}

/* eslint-enable max-classes-per-file */
