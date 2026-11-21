import type { Page } from '@playwright/test';

/**
 * Stops the time of a page whose clock `page.clock.install()` faked. Timers,
 * animations and the lifetime of toasts wait for `page.clock.runFor()`.
 */
export async function pauseClock(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  // The clock runs on while the page answers. Pausing in the past fails.
  await page.clock.pauseAt(now + 1000);
}
