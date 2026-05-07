import type { Page } from '@playwright/test';

export class SchemaPage {
  constructor(private page: Page) {}

  get newTableButton() { return this.page.getByRole('button', { name: 'New Table' }); }
  get importFromFileLink() { return this.page.getByRole('link', { name: 'Import from a File' }); }

  tableLink(name: string) {
    // Exact match — otherwise a table name that is a substring of a breadcrumb
    // label (e.g., table "patents" vs database "patents_db") would match both.
    return this.page.getByRole('link', { name, exact: true });
  }
}
