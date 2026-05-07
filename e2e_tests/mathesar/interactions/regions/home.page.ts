import type { Page } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: 'Databases' }); }
  get connectDatabaseButton() { return this.page.getByRole('button', { name: 'Connect Database' }); }
  get searchDatabasesInput() { return this.page.getByRole('textbox', { name: 'Search Databases' }); }

  async goto() { await this.page.goto('/'); }

  databaseLink(name: string) {
    return this.page.getByRole('link', { name: `Open database ${name}` });
  }

  databaseEntry(name: string) {
    return this.page.getByText(name);
  }
}
