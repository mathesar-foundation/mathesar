import type { Locator, Page } from '@playwright/test';

import type { Database } from '../../api/mathesar';
import { menuItem } from '../components/menu';
import { databaseUrl } from '../urls';
import { Modal } from '../components/modal';

/** The modal that creates or renames a schema. */
export class SchemaFormModal extends Modal {
  readonly name: Locator;
  readonly description: Locator;

  constructor(page: Page, title: string | RegExp) {
    super(page, title);
    this.name = this.root.getByLabel('Name');
    this.description = this.root.getByLabel('Description');
  }
}

export class DatabasePage {
  readonly schemaSearch: Locator;
  readonly searchSummary: Locator;
  readonly clearSearchButton: Locator;
  readonly createSchemaButton: Locator;
  readonly schemaRows: Locator;
  readonly createSchemaModal: SchemaFormModal;
  readonly deleteSchemaModal: Modal;

  constructor(private readonly page: Page) {
    const schemasPanel = page.getByRole('tabpanel', { name: /Schemas/ });
    this.schemaSearch = schemasPanel.getByPlaceholder('Search Schemas');
    this.searchSummary = schemasPanel.getByText(/schemas? match/);
    this.clearSearchButton = schemasPanel.getByRole('button', {
      name: 'Clear',
    });
    this.createSchemaButton = schemasPanel.getByRole('button', {
      name: 'Create Schema',
    });
    this.schemaRows = schemasPanel.getByRole('list').getByRole('listitem');
    this.createSchemaModal = new SchemaFormModal(page, 'Create Schema');
    this.deleteSchemaModal = new Modal(page, /^Delete Schema/);
  }

  async goto(database: Database): Promise<void> {
    await this.page.goto(databaseUrl(database));
  }

  schemaRow(name: string): Locator {
    return this.schemaRows.filter({
      has: this.page.getByRole('link', { name, exact: true }),
    });
  }

  schemaLink(name: string): Locator {
    return this.schemaRow(name).getByRole('link', { name, exact: true });
  }

  renameSchemaModal(currentName: string): SchemaFormModal {
    return new SchemaFormModal(this.page, `Rename Schema ${currentName}`);
  }

  async chooseSchemaAction(
    schemaName: string,
    action: 'Rename Schema' | 'Delete Schema',
  ): Promise<void> {
    await this.schemaRow(schemaName).getByRole('button').click();
    await menuItem(this.page, action).click();
  }
}
