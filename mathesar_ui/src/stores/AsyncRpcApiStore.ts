import { CancellablePromise } from '@mathesar/component-library';
import {
  type RpcRequest,
  type RpcResponse,
  batchSend,
} from '@mathesar/packages/json-rpc-client-builder';

import AsyncStore from './AsyncStore';

export default class AsyncRpcApiStore<Props, T, U> extends AsyncStore<
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

  batchRunner(
    props: Props,
  ): [RpcRequest<T>, (response: RpcResponse<T>) => void] {
    const onReponse = (response: RpcResponse<T>) => {
      if (response.status === 'ok') {
        this.setResolvedValue(this.postProcess(response.value));
      } else {
        this.setRejectedError(response);
      }
    };
    return [this.apiRpcFn(props), onReponse];
  }

  static async runBatched(
    batchRunners: [
      RpcRequest<unknown>,
      (response: RpcResponse<unknown>) => void,
    ][],
  ) {
    const requests = batchRunners.map((runner) => runner[0]);
    const results = await batchSend(requests);
    batchRunners.forEach((runner, index) => {
      runner[1](results[index]);
    });
  }
}
