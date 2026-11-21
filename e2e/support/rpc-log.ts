import type { Page } from '@playwright/test';

interface RpcCall {
  method: string;
}

/** The names of the RPC methods that the page calls from now on, in order. */
export function recordRpcCalls(page: Page): string[] {
  const methods: string[] = [];
  page.on('request', (request) => {
    if (!request.url().endsWith('/api/rpc/v0/')) return;
    const body = request.postDataJSON() as RpcCall | RpcCall[];
    for (const call of [body].flat()) methods.push(call.method);
  });
  return methods;
}
