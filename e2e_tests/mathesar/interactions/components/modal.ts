import type { Page, Locator } from '@playwright/test';

export class Modal {
  constructor(private root: Locator) {}

  get title() { return this.root.locator('[data-window-area="title"]').first(); }
  get content() { return this.root; }

  async close() {
    await this.root.getByRole('button', { name: 'Close' }).click();
  }
}

/** Scoped modal factory — locates a dialog by its heading text (portaled to body). */
export function modal(page: Page, titleText: string | RegExp): Modal {
  return new Modal(
    page.locator('[role="dialog"]').filter({
      has: page.locator('[data-window-area="title"]').filter({ hasText: titleText })
    })
  );
}
