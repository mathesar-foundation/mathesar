import type { Page, Locator } from '@playwright/test';

export class SchemaPage {
  private page: Page;
  readonly newTableButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newTableButton = page.getByRole('button', { name: 'New Table' });
  }

  tableLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}
