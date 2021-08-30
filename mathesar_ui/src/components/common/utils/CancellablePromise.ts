export default class CancellablePromise<T> extends Promise<T> {
  isCancelled = false;

  onCancel: () => void;

  constructor(executor: (
    resolve: (value?: T | Promise<T>) => void,
    reject: (reason?: unknown) => void,
  ) => void, onCancel?: () => void) {
    super(executor);
    this.onCancel = onCancel;
  }

  cancel(): void {
    this.isCancelled = true;
    this.onCancel?.();
  }

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null,
    onRejected?: ((reason: unknown) => TResult2 | Promise<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    const resolve = (value: T): TResult1 | Promise<TResult1> => {
      if (this.isCancelled) {
        return null;
      }
      return onFulfilled?.(value) || value as unknown as TResult1;
    };

    const reject = (reason: unknown): TResult2 | Promise<TResult2> => {
      if (this.isCancelled) {
        return null;
      }
      if (!onRejected) {
        throw reason;
      }
      return onRejected(reason);
    };

    if (this.isCancelled) {
      return null;
    }
    return super.then(resolve, reject);
  }
}
