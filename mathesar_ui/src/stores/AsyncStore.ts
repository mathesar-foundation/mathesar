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

export type AsyncStoreOptions<T, E> = Partial<{
  getError: (caughtValue: unknown) => E;
  initialValue: T;
}>;

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

  get hasSettled(): boolean {
    return this.settlement !== undefined;
  }

  get isIdleAndUnsettled(): boolean {
    return !this.hasSettled && !this.isLoading;
  }
}

export default class AsyncStore<Props = void, T = unknown, E = string>
  implements Readable<AsyncStoreValue<T, E>>
{
  private runFn: (props: Props) => Promise<T> | CancellablePromise<T>;

  private getError: (caughtValue: unknown) => E;

  protected value: Writable<AsyncStoreValue<T, E>> = writable(
    new AsyncStoreValue({ isLoading: false }),
  );

  private promise: Promise<T> | CancellablePromise<T> | undefined = undefined;

  constructor(
    run: (props: Props) => Promise<T> | CancellablePromise<T>,
    options?: AsyncStoreOptions<T, E>,
  ) {
    this.runFn = run;
    this.getError =
      options?.getError ?? (getErrorMessage as (data: unknown) => E);
    if (hasProperty(options, 'initialValue')) {
      this.value = writable(
        new AsyncStoreValue<T, E>({
          isLoading: false,
          settlement: { state: 'resolved', value: options.initialValue as T },
        }),
      );
    }
  }

  subscribe(
    subscriber: Subscriber<AsyncStoreValue<T, E>>,
    invalidate?:
      | ((value?: AsyncStoreValue<T, E> | undefined) => void)
      | undefined,
  ): Unsubscriber {
    return this.value.subscribe(subscriber, invalidate);
  }

  async run(props: Props): Promise<AsyncStoreValue<T, E>> {
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

  async runConservatively(props: Props): Promise<AsyncStoreValue<T, E>> {
    const value = get(this.value);
    if (value.isIdleAndUnsettled) {
      return this.run(props);
    }
    return value;
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
