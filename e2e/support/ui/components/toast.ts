import { type Locator, type Page, expect } from '@playwright/test';

export class Toasts {
  readonly items: Locator;

  constructor(page: Page) {
    this.items = page.locator('.toast-item');
  }

  async expectMessage(text: string | RegExp): Promise<void> {
    await expect(this.items.filter({ hasText: text })).toBeVisible();
  }
}
