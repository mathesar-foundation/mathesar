import type { Page } from '@playwright/test';

export class SchemaPage {
  constructor(private page: Page) {}

  get newTableButton() { return this.page.getByRole('button', { name: 'New Table' }); }

  tableLink(name: string) {
    return this.page.getByRole('link', { name });
  }
}
