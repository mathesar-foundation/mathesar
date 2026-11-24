import type { Locator, Page } from '@playwright/test';

/** The floating text that explains the control under the pointer. */
export function tooltip(page: Page): Locator {
  return page.locator('.tooltip');
}
