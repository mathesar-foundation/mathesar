import type { Page, Request } from '@playwright/test';

interface RpcCall {
  method: string;
}

/**
 * Keeps matching requests unanswered until the returned function is called,
 * so that a test can look at the page while it waits for the server.
 */
export async function holdRequests(
  page: Page,
  url: string,
  isHeld: (request: Request) => boolean = () => true,
): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(url, async (route) => {
    if (isHeld(route.request())) await released;
    await route.fallback();
  });
  return release;
}

/** Holds the requests that call one RPC method. */
export function holdRpcCalls(page: Page, method: string): Promise<() => void> {
  return holdRequests(page, '**/api/rpc/v0/', (request) => {
    const body = request.postDataJSON() as RpcCall | RpcCall[];
    return [body].flat().some((call) => call.method === method);
  });
}
