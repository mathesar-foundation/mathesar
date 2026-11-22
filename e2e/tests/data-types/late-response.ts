import type { Page } from '@playwright/test';

interface RpcCall {
  method: string;
}

/**
 * Sends the first call of an RPC method to the server at once, but hands its
 * response to the page only when the returned function is called.
 */
export async function delayFirstResponse(
  page: Page,
  method: string,
): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let isFirstCall = true;
  await page.route('**/api/rpc/v0/', async (route) => {
    const body = route.request().postDataJSON() as RpcCall | RpcCall[];
    if (!isFirstCall || ![body].flat().some((call) => call.method === method)) {
      await route.fallback();
      return;
    }
    isFirstCall = false;
    const response = await route.fetch();
    await released;
    await route.fulfill({ response });
  });
  return release;
}
