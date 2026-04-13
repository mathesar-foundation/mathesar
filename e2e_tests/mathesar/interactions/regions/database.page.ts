import type { Page } from '@playwright/test';

export class DatabasePage {
  constructor(private page: Page) {}

  get schemasHeading() { return this.page.getByRole('tab', { name: /Schemas/ }); }
  get createSchemaButton() { return this.page.getByRole('button', { name: 'Create Schema' }); }
  get searchSchemasInput() { return this.page.getByRole('textbox', { name: 'Search Schemas' }); }

  schemaLink(name: string) {
    return this.page.getByRole('link', { name });
  }
}
