import type { Page, Locator } from '@playwright/test';

export class DatabasePage {
  private page: Page;
  readonly schemasHeading: Locator;
  readonly createSchemaButton: Locator;
  readonly searchSchemasInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.schemasHeading = page.getByRole('tab', { name: /Schemas/ });
    this.createSchemaButton = page.getByRole('button', {
      name: 'Create Schema',
    });
    this.searchSchemasInput = page.getByRole('textbox', {
      name: 'Search Schemas',
    });
  }

  schemaLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}
