import { CancellablePromise, hasProperty } from '@mathesar-component-library';

import { RpcError } from './RpcError';

const METHOD_PATH_SEPARATOR = '.';
const jsonrpc = '2.0';

export interface RpcResult<T> {
  status: 'ok';
  value: T;
}

export type RpcResponse<T> = RpcResult<T> | RpcError;

function cancellableFetch(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
): CancellablePromise<Response> {
  const controller = new AbortController();
  return new CancellablePromise<Response>(
    (resolve, reject) =>
      void fetch(input, { ...init, signal: controller.signal })
        .then(resolve)
        .catch(reject),
    () => controller.abort(),
  );
}

function getRpcRequestBody(request: RpcRequest<unknown>, id = 0) {
  return {
    jsonrpc,
    id,
    method: request.method,
    params: request.params,
  };
}

function makeRpcResponse<T = unknown>(value: unknown): RpcResponse<T> {
  if (hasProperty(value, 'result')) {
    const response: RpcResult<T> = {
      status: 'ok',
      value: value.result as T,
    };
    return response;
  }
  return RpcError.fromAnything(value);
}

function send<T>(request: RpcRequest<T>): CancellablePromise<RpcResponse<T>> {
  const fetch = cancellableFetch(request.endpoint, {
    method: 'POST',
    headers: {
      ...request.getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(getRpcRequestBody(request)),
  });
  return new CancellablePromise(
    (resolve) =>
      void fetch
        .then(
          (response) => response.json(),
          // If the fetch promise rejects (e.g. for a network connection error),
          // we still want to _resolve_ the returned promise (instead of
          // _rejecting_ it). This way all error-handling is done consistently
          // by using the two variants of RpcResponse.
          (rejectionReason) => resolve(RpcError.fromAnything(rejectionReason)),
        )
        .then((json) => resolve(makeRpcResponse(json))),
    () => fetch.cancel(),
  );
}

function makeRpcBatchResponse<T extends RpcRequest<unknown>[]>(
  values: unknown,
): RpcBatchResponse<T> {
  if (!Array.isArray(values)) {
    throw new Error('Response is not an array');
  }
  return values.map((value) => makeRpcResponse(value)) as RpcBatchResponse<T>;
}

function sendBatchRequest<T extends RpcRequest<unknown>[]>(
  endpoint: string,
  headers: Record<string, string | undefined>,
  requests: T,
): CancellablePromise<RpcBatchResponse<T>> {
  const fetch = cancellableFetch(endpoint, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      requests.map((request, index) => getRpcRequestBody(request, index)),
    ),
  });
  return new CancellablePromise(
    (resolve) =>
      void fetch
        .then(
          (response) => response.json(),
          (rejectionReason) =>
            resolve(
              requests.map(() =>
                RpcError.fromAnything(rejectionReason),
              ) as RpcBatchResponse<T>,
            ),
        )
        .then((json) => resolve(makeRpcBatchResponse(json))),
    () => fetch.cancel(),
  );
}

export type GetHeaders = () => Record<string, string | undefined>;

export class RpcRequest<T> {
  endpoint: string;

  /** The full namespaced path to the method name */
  path: string[];

  params: unknown;

  getHeaders: GetHeaders;

  constructor(p: {
    endpoint: string;
    path: string[];
    params: unknown;
    getHeaders: GetHeaders;
  }) {
    this.endpoint = p.endpoint;
    this.path = p.path;
    this.params = p.params;
    this.getHeaders = p.getHeaders;
  }

  get method() {
    return this.path.join(METHOD_PATH_SEPARATOR);
  }

  /**
   * The simplest, most common way to run an API request.
   *
   * @throws `ApiError` when awaited if any errors are encountered.
   */
  run(): CancellablePromise<T> {
    const responsePromise = this.send();
    return new CancellablePromise(
      (resolve, reject) =>
        void responsePromise.then(
          (rpcResponse) =>
            rpcResponse.status === 'ok'
              ? resolve(rpcResponse.value)
              : reject(rpcResponse),
          (error) => reject(RpcError.fromAnything(error)),
        ),
      () => responsePromise.cancel(),
    );
  }

  /**
   * Provides more fine-grained control instead of `run` by returning
   * ApiResult which can be type-narrowed manually.
   *
   * Will not reject or throw errors.
   */
  send(): CancellablePromise<RpcResponse<T>> {
    return send(this);
  }
}

export type RpcBatchResponse<T extends RpcRequest<unknown>[]> = {
  [K in keyof T]: T[K] extends RpcRequest<infer R> ? RpcResponse<R> : never;
};

export function batchSend<T extends RpcRequest<unknown>[]>(
  requests: T,
): CancellablePromise<RpcBatchResponse<T>> {
  if (requests.length === 0) {
    throw new Error('There must be atleast one request');
  }
  const [firstRequest, ...rest] = requests;
  const { endpoint } = firstRequest;
  if (rest.some((request) => request.endpoint !== endpoint)) {
    throw new Error('Only RPC requests to the same endpoint can be batched');
  }
  // TODO: Decide if headers need to be merged
  return sendBatchRequest(endpoint, firstRequest.getHeaders(), requests);
}

/**
 * A factory function to builds a function that directly runs a specific RPC
 * request. The built function will then accept all the props of the RPC method
 * and run the request without needing to call `.run()` on it.
 *
 * This utility is useful when you want to define a function that runs a
 * specific RPC method without having to spell out the type of the method
 * parameters.
 */
export function runner<P, R>(
  method: (props: P) => RpcRequest<R>,
): (props: P) => CancellablePromise<R> {
  return (props) => method(props).run();
}
