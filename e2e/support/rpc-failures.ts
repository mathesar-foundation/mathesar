import type { Page, Route } from '@playwright/test';

interface RpcCall {
  id: number;
  method: string;
}

/**
 * Makes every request of the page that calls this RPC method fail with the
 * message, until the returned function is called.
 */
export async function failRpcMethod(
  page: Page,
  method: string,
  message: string,
): Promise<() => Promise<void>> {
  const url = '**/api/rpc/v0/';
  const handler = async (route: Route): Promise<void> => {
    const body = route.request().postDataJSON() as RpcCall | RpcCall[];
    const calls = [body].flat();
    if (!calls.some((call) => call.method === method)) {
      await route.fallback();
      return;
    }
    const errors = calls.map(({ id }) => ({
      jsonrpc: '2.0',
      id,
      error: { code: -1, message },
    }));
    await route.fulfill({ json: Array.isArray(body) ? errors : errors[0] });
  };
  await page.route(url, handler);
  return () => page.unroute(url, handler);
}

interface RpcAnswer {
  id: number;
}

/**
 * Like `failRpcMethod`, but only the calls of this method fail: the other calls of
 * a batch get the answers of the server.
 */
export async function failOnlyRpcMethod(
  page: Page,
  method: string,
  message: string,
): Promise<() => Promise<void>> {
  const url = '**/api/rpc/v0/';
  const handler = async (route: Route): Promise<void> => {
    const body = route.request().postDataJSON() as RpcCall | RpcCall[];
    const failing = [body]
      .flat()
      .filter((call) => call.method === method)
      .map(({ id }) => id);
    if (failing.length === 0) {
      await route.fallback();
      return;
    }
    // Playwright cannot decode zstd, which Firefox accepts and the server prefers.
    const response = await route.fetch({
      headers: { ...route.request().headers(), 'accept-encoding': 'gzip' },
    });
    const answers = (await response.json()) as RpcAnswer | RpcAnswer[];
    const changed = [answers]
      .flat()
      .map((answer) =>
        failing.includes(answer.id)
          ? { jsonrpc: '2.0', id: answer.id, error: { code: -1, message } }
          : answer,
      );
    await route.fulfill({
      response,
      json: Array.isArray(answers) ? changed : changed[0],
    });
  };
  await page.route(url, handler);
  return () => page.unroute(url, handler);
}
