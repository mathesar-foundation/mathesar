import { get } from 'svelte/store';

import { CancellablePromise } from '@mathesar/component-library';
import {
  type RpcRequest,
  type RpcResponse,
  batchSend,
} from '@mathesar/packages/json-rpc-client-builder';

import AsyncStore, { type AsyncStoreValue } from './AsyncStore';

type BatchRunner<T = any, U = any> = {
  send: RpcRequest<T>;
  beforeRequest: () => void;
  onResponse: (response: RpcResponse<T>) => void;
  getValue: () => AsyncStoreValue<U, string>;
};

export default class AsyncRpcApiStore<Props, T, U = T> extends AsyncStore<
  Props,
  U
> {
  apiRpcFn: (props: Props) => RpcRequest<T>;

  postProcess: (response: T) => U;

  constructor(
    rpcFn: (props: Props) => RpcRequest<T>,
    options?: Partial<{
      getError: (caughtValue: unknown) => string;
      initialValue: U;
      postProcess: (response: T) => U;
    }>,
  ) {
    const postProcess =
      options?.postProcess ?? ((response: T) => response as unknown as U);
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

  static async runBatched(
    batchRunners: BatchRunner[],
    options?: Partial<{
      mode?: 'force-run' | 'optimal' | ('force-run' | 'optimal')[];
    }>,
  ) {
    const toRun = (() => {
      if (options?.mode && Array.isArray(options.mode)) {
        if (options.mode.length !== batchRunners.length) {
          throw new Error(
            'Number of run options do not match number of batchRunners',
          );
        }
        return batchRunners.filter((runner, index) => {
          switch (options.mode?.[index]) {
            case 'force-run':
              return true;
            case 'optimal':
            default:
              return !runner.getValue().hasInitialized;
          }
        });
      }
      if (options?.mode === 'force-run') {
        return batchRunners;
      }
      // default is `optimal`
      return batchRunners.filter((runner) => !runner.getValue().hasInitialized);
    })();

    if (toRun.length > 0) {
      toRun.forEach((runner) => {
        runner.beforeRequest();
      });
      const results = await batchSend(toRun.map((runner) => runner.send));
      toRun.forEach((runner, index) => {
        runner.onResponse(results[index]);
      });
    }
  }
}
