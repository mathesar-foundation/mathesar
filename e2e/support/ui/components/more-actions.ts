import type { Locator } from '@playwright/test';

/** The button with three dots on a card, a row or a page header. It has no accessible name. */
export function moreActionsButton(container: Locator): Locator {
  return container.locator('button[aria-haspopup="listbox"]');
}
