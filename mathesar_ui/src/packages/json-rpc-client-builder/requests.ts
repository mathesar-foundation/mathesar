import { CancellablePromise, hasProperty } from '@mathesar-component-library';

import { RpcError } from './RpcError';

const METHOD_PATH_SEPARATOR = '.';
const jsonrpc = '2.0';

export interface RpcResult<T> {
  status: 'ok';
  value: T;
}

export type RpcResponse<T> = RpcResult<T> | RpcError;

interface RpcRequestBody<T> {
  id: number;
  jsonrpc: typeof jsonrpc;
  method: RpcRequest<T>['method'];
  params: RpcRequest<T>['params'];
}

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

function getRpcRequestBody<T = unknown>(
  request: RpcRequest<T>,
  id = 0,
): RpcRequestBody<T> {
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
  requestBodies: RpcRequestBody<unknown>[],
): RpcBatchSendResponse<T> {
  if (!Array.isArray(values)) {
    throw new Error('Response is not an array');
  }
  const idToRpcResponseMap = new Map(
    values.map((value) => {
      if (!hasProperty(value, 'id')) {
        throw new Error(
          'Response array does not conform to RPC spec: "id" missing in values',
        );
      }
      return [value.id, makeRpcResponse(value)];
    }),
  );
  return requestBodies.map((r) => {
    const response = idToRpcResponseMap.get(r.id);
    if (response === undefined) {
      throw new Error(
        `Response array does not contain the response for the request with id: ${r.id}`,
      );
    }
    return response;
  }) as RpcBatchSendResponse<T>;
}

function sendBatchRequest<T extends RpcRequest<unknown>[]>(
  endpoint: string,
  headers: Record<string, string | undefined>,
  requests: T,
): CancellablePromise<RpcBatchSendResponse<T>> {
  const rpcRequestBody = requests.map((request, index) =>
    getRpcRequestBody(request, index),
  );
  const fetch = cancellableFetch(endpoint, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rpcRequestBody),
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
              ) as RpcBatchSendResponse<T>,
            ),
        )
        .then((json) => resolve(makeRpcBatchResponse(json, rpcRequestBody))),
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

type RpcBatchSendResponse<T extends RpcRequest<unknown>[]> = {
  [K in keyof T]: T[K] extends RpcRequest<infer R> ? RpcResponse<R> : never;
};

/**
 * Use this to run multiple RPC requests in a single batch and handle errors on
 * a per-request basis.
 *
 * This function will not throw any errors when awaited.
 *
 * For less boilerplate, use `batchRun` which is simpler but less powerful.
 */
export function batchSend<
  T extends
    | [RpcRequest<unknown>, ...RpcRequest<unknown>[]]
    | RpcRequest<unknown>[],
>(requests: T): CancellablePromise<RpcBatchSendResponse<T>> {
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

type RpcBatchRunResponse<T extends RpcRequest<unknown>[]> = {
  [K in keyof T]: T[K] extends RpcRequest<infer R> ? R : never;
};

/**
 * Use this to run multiple RPC requests without fine-grained error handling.
 *
 * For more control over error handling, use `batchSend` and handle errors
 * manually.
 *
 * @throws `RpcError` when awaited if any errors are encountered. When multiple
 * requests are run, there can be multiple errors. In that case, the first error
 * encountered is thrown.
 */
export function batchRun<
  T extends
    | [RpcRequest<unknown>, ...RpcRequest<unknown>[]]
    | RpcRequest<unknown>[],
>(requests: T): CancellablePromise<RpcBatchRunResponse<T>> {
  const promise = batchSend(requests);
  return new CancellablePromise(
    (resolve, reject) => {
      promise
        .then((responses) => {
          const values = [];
          for (const response of responses as RpcResponse<unknown>[]) {
            if (response.status !== 'ok') return reject(response);
            values.push(response.value);
          }
          return resolve(values as RpcBatchRunResponse<T>);
        }, reject)
        .catch(reject);
    },
    () => promise.cancel(),
  );
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
