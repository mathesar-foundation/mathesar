import type { Locator, Page } from '@playwright/test';

/** The side navigation of the administration pages. */
export class AdminNavigation {
  private readonly root: Locator;
  /** The dot that announces a newer release of Mathesar. */
  readonly upgradeDot: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('complementary').getByRole('menu');
    this.upgradeDot = this.item('Update').locator('.notification-dot');
  }

  item(name: 'Update' | 'Users' | 'Settings'): Locator {
    return this.root.getByRole('menuitem', { name });
  }
}
