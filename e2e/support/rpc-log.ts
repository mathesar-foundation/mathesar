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

interface RecordingWindow extends Window {
  recordRpcFetch: (method: string) => Promise<void>;
}

/**
 * The names of the RPC methods that the page passes to `fetch` from now on, in order. Unlike
 * the requests, they include a call cancelled at once, which Firefox does not send.
 */
export async function recordRpcFetches(page: Page): Promise<string[]> {
  const methods: string[] = [];
  await page.exposeFunction('recordRpcFetch', (method: string) => {
    methods.push(method);
  });
  await page.addInitScript(() => {
    const send = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (
        typeof input === 'string' &&
        input.endsWith('/api/rpc/v0/') &&
        typeof init?.body === 'string'
      ) {
        const body = JSON.parse(init.body) as RpcCall | RpcCall[];
        for (const call of [body].flat()) {
          void (window as unknown as RecordingWindow).recordRpcFetch(
            call.method,
          );
        }
      }
      return send(input, init);
    };
  });
  return methods;
}
