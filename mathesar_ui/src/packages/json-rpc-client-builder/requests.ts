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
    body: JSON.stringify({
      jsonrpc,
      id: 0,
      method: request.method,
      params: request.params,
    }),
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

export type RpcBatchResponse<T extends RpcRequest<unknown>[]> =
  CancellablePromise<{
    [K in keyof T]: T[K] extends RpcRequest<infer R> ? RpcResponse<R> : never;
  }>;

export function batchSend<T extends RpcRequest<unknown>[]>(
  ...requests: T
): RpcBatchResponse<T> {
  // TODO implement batch sending
  throw new Error('Not implemented');
}
