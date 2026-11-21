import { type APIRequestContext, request } from '@playwright/test';

import { env } from '../env';

interface RpcSuccess<T> {
  result: T;
}

interface RpcFailure {
  error: { code: number; message: string };
}

export interface Credentials {
  username: string;
  password: string;
}

export class RpcError extends Error {
  constructor(
    readonly method: string,
    readonly code: number,
    message: string,
  ) {
    super(`${method} failed with code ${code}: ${message}`);
  }
}

/** Calls Mathesar's JSON-RPC API as one user. */
export class RpcClient {
  private constructor(private readonly http: APIRequestContext) {}

  static async connect(credentials: Credentials): Promise<RpcClient> {
    const http = await request.newContext({
      baseURL: env.baseUrl,
      httpCredentials: { ...credentials, send: 'always' },
    });
    return new RpcClient(http);
  }

  async call<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const response = await this.http.post('/api/rpc/v0/', {
      data: { jsonrpc: '2.0', id: 0, method, params },
    });
    const body = (await response.json()) as RpcSuccess<T> | RpcFailure;
    if ('error' in body) {
      throw new RpcError(method, body.error.code, body.error.message);
    }
    return body.result;
  }

  async dispose(): Promise<void> {
    await this.http.dispose();
  }
}
