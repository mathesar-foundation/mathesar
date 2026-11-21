import type { Locator, Page } from '@playwright/test';

/** An entry of the dropdown or context menu that is open. */
export function menuItem(page: Page, name: string | RegExp): Locator {
  return page.getByRole('menu').getByRole('menuitem', { name });
}
