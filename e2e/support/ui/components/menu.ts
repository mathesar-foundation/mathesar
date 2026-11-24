import type { Locator, Page } from '@playwright/test';

/** The dropdown or context menu that is open. */
export function openMenu(page: Page): Locator {
  return page.getByRole('menu');
}

export function menuItem(page: Page, name: string | RegExp): Locator {
  return openMenu(page).getByRole('menuitem', { name, exact: true });
}

/** Closes the context menu the way a click next to it does. */
export async function dismissContextMenu(page: Page): Promise<void> {
  await page
    .locator('.context-menu-backdrop')
    .click({ position: { x: 5, y: 5 } });
}
