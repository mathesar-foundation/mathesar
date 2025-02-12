import { get } from 'svelte/store';

import { CancellablePromise, hasProperty } from '@mathesar/component-library';
import {
  RpcError,
  type RpcRequest,
  type RpcResponse,
  batchSend,
} from '@mathesar/packages/json-rpc-client-builder';

import AsyncStore, {
  type AsyncStoreOptions,
  type AsyncStoreValue,
} from './AsyncStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BatchRunner<T = any, U = any> = {
  send: RpcRequest<T>;
  beforeRequest: () => void;
  onResponse: (response: RpcResponse<T>) => void;
  getValue: () => AsyncStoreValue<U, RpcError>;
};

export default class AsyncRpcApiStore<Props, T, U = T> extends AsyncStore<
  Props,
  U,
  RpcError
> {
  apiRpcFn: (props: Props) => RpcRequest<T>;

  postProcess: (response: T) => U;

  constructor(
    rpcFn: (props: Props) => RpcRequest<T>,
    options?: Partial<{
      initialValue: U;
      postProcess: (response: T) => U;
    }>,
  ) {
    const postProcess =
      options?.postProcess ?? ((response: T) => response as unknown as U);
    const asyncStoreOptions: AsyncStoreOptions<U, RpcError> = {
      getError: (err: unknown) => RpcError.fromAnything(err),
    };
    if (hasProperty(options, 'initialValue')) {
      asyncStoreOptions.initialValue = options.initialValue;
    }
    super(
      (props: Props) =>
        new CancellablePromise((resolve, reject) => {
          rpcFn(props)
            .run()
            .then(
              (value) => resolve(postProcess(value)),
              (error) => reject(error),
            )
            .catch((error) => reject(error));
        }),
      asyncStoreOptions,
    );
    this.apiRpcFn = rpcFn;
    this.postProcess = postProcess;
  }

  batchRunner(props: Props): BatchRunner<T, U> {
    const onResponse = (response: RpcResponse<T>) => {
      if (response.status === 'ok') {
        this.setResolvedValue(this.postProcess(response.value));
      } else {
        this.setRejectedError(response);
      }
    };
    const beforeRequest = () => {
      this.beforeRun();
    };
    return {
      send: this.apiRpcFn(props),
      beforeRequest,
      onResponse,
      getValue: () => get(this.value),
    };
  }

  static async runBatch(runners: BatchRunner[]) {
    if (runners.length === 0) return;
    runners.forEach((runner) => runner.beforeRequest());
    const results = await batchSend(runners.map((runner) => runner.send));
    runners.forEach((runner, index) => runner.onResponse(results[index]));
  }

  /**
   * Runs the BatchRunners that have not yet been initialized. Skips the ones
   * that have already been initialized.
   */
  static async runBatchConservatively(runners: BatchRunner[]) {
    const toRun = runners.filter(
      (runner) => runner.getValue().isIdleAndUnsettled,
    );
    await AsyncRpcApiStore.runBatch(toRun);
  }
}
