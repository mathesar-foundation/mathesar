import type { Page, Locator } from '@playwright/test';

export class DatabasesPage {
  private page: Page;
  readonly heading: Locator;
  readonly connectDatabaseButton: Locator;
  readonly searchDatabasesInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Databases' });
    this.connectDatabaseButton = page.getByRole('button', {
      name: 'Connect Database',
    });
    this.searchDatabasesInput = page.getByRole('textbox', {
      name: 'Search Databases',
    });
  }

  async goto() {
    await this.page.goto('/');
  }

  databaseLink(name: string): Locator {
    return this.page.getByRole('link', { name: `Open database ${name}` });
  }

  databaseEntry(name: string): Locator {
    return this.page.getByText(name);
  }
}

export class ConnectDatabaseDialog {
  private page: Page;
  readonly databaseNameInput: Locator;
  readonly createNewDatabaseButton: Locator;
  readonly createDatabaseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.databaseNameInput = page.getByRole('textbox', {
      name: 'Database Name',
    });
    this.createNewDatabaseButton = page.getByRole('button', {
      name: /Create a New Database/,
    });
    this.createDatabaseButton = page.getByRole('button', {
      name: 'Create Database',
    });
  }

  sampleSchemaCheckbox(name: string): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(name) });
  }

  async createNewDatabase(name: string, sampleSchema?: string) {
    await this.createNewDatabaseButton.click();
    await this.databaseNameInput.fill(name);
    if (sampleSchema) {
      await this.sampleSchemaCheckbox(sampleSchema).check();
    }
    await this.createDatabaseButton.click();
  }
}
