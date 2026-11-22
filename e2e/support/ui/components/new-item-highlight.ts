import type { Locator, Page } from '@playwright/test';

/** The frame that flashes for two seconds around an item that was added to a list. */
export function newItemHighlight(page: Page): Locator {
  return page.locator('.new-item-highlighter');
}

/** The note that points to a new item outside the visible part of the list. */
export function newItemScrollHint(page: Page): Locator {
  return page.locator('.new-item-highlighter__hint');
}

/**
 * A list highlights nothing in the two seconds after it loads. This skips them.
 * The test must call `page.clock.install()` before it opens the page.
 */
export async function skipHighlightDelay(page: Page): Promise<void> {
  await page.clock.fastForward(2000);
}

/** Stops the clock. A highlight then stays until the test moves the clock on. */
export async function keepHighlights(page: Page): Promise<void> {
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
}

/**
 * Resolves once the browser has checked whether the item is in view. A list
 * highlights a new item when that check reports it, so a highlight exists by then.
 */
export async function waitForViewCheck(item: Locator): Promise<void> {
  await item.evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(element);
      }),
  );
}
