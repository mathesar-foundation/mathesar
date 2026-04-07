import type { Page } from '@playwright/test';
import { Modal } from './modal';

/**
 * The "Connect Database" dialog — portaled to body, so scoped via
 * the modal factory pattern rather than a parent Locator.
 */
export class ConnectDatabaseModal extends Modal {
  // Re-scope to content for all queries within the dialog
  get databaseNameInput() { return this.content.getByRole('textbox', { name: 'Database Name' }); }
  get createNewDatabaseButton() { return this.content.getByRole('button', { name: /Create a New Database/ }); }
  get createDatabaseButton() { return this.content.getByRole('button', { name: 'Create Database' }); }

  sampleSchemaCheckbox(name: string) {
    return this.content.getByRole('checkbox', { name: new RegExp(name) });
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

/** Factory: locates the Connect Database dialog by its heading. */
export function connectDatabaseModal(page: Page): ConnectDatabaseModal {
  return new ConnectDatabaseModal(
    page.locator('[role="dialog"]').filter({
      has: page.getByRole('heading').filter({ hasText: /Connect Database/ })
    })
  );
}
