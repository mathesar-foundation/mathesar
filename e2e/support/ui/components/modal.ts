import { type Locator, type Page, expect } from '@playwright/test';

/** A modal window, found by its title. */
export class Modal {
  readonly root: Locator;
  readonly title: Locator;
  readonly body: Locator;
  readonly footer: Locator;

  constructor(page: Page, title: string | RegExp) {
    this.root = page.locator('.modal').filter({
      has: page.locator('[data-window-area="title"]', { hasText: title }),
    });
    this.title = this.root.locator('[data-window-area="title"]');
    this.body = this.root.locator('[data-window-area="body"]');
    this.footer = this.root.locator('[data-window-area="footer"]');
  }

  button(name: string | RegExp): Locator {
    return this.root.getByRole('button', { name });
  }

  async close(): Promise<void> {
    await this.root.locator('[data-window-area="title-bar"] button').click();
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.root).toHaveCount(0);
  }
}
