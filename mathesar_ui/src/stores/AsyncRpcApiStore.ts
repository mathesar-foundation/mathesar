import { get } from 'svelte/store';

import {
  CancellablePromise,
  hasProperty,
  isDefinedNonNullable,
} from '@mathesar/component-library';
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

type OmitOrVoid<T, K extends keyof T> = keyof Omit<T, K> extends never
  ? void
  : Omit<T, K>;

export default class AsyncRpcApiStore<
  Props,
  T,
  U = T,
  StaticPropKeys extends keyof Props = never,
> extends AsyncStore<OmitOrVoid<Props, StaticPropKeys>, U, RpcError> {
  apiRpcFn: (props: Props) => RpcRequest<T>;

  postProcess: (response: T) => U;

  staticProps?: Pick<Props, StaticPropKeys>;

  constructor(
    rpcFn: (props: Props) => RpcRequest<T>,
    options?: Partial<{
      initialValue: U;
      postProcess: (response: T) => U;
      staticProps: Pick<Props, StaticPropKeys>;
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
    const staticProps = options?.staticProps ?? undefined;
    super(
      (dynamicProps: OmitOrVoid<Props, StaticPropKeys>) =>
        new CancellablePromise((resolve, reject) => {
          rpcFn(this.getProps(dynamicProps))
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
    this.staticProps = staticProps;
  }

  getProps(dynamicProps: OmitOrVoid<Props, StaticPropKeys>): Props {
    if (
      isDefinedNonNullable(this.staticProps) &&
      isDefinedNonNullable(dynamicProps)
    ) {
      return {
        ...this.staticProps,
        ...dynamicProps,
      } as Props;
    }
    if (isDefinedNonNullable(this.staticProps)) {
      return this.staticProps as Props;
    }
    return dynamicProps as Props;
  }

  batchRunner(
    dynamicProps: OmitOrVoid<Props, StaticPropKeys>,
  ): BatchRunner<T, U> {
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
      send: this.apiRpcFn(this.getProps(dynamicProps)),
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
