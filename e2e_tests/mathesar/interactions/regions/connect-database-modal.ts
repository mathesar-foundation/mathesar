import type { Page } from '@playwright/test';
import { Modal } from '../components/modal';

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

/**
 * Factory: locates the topmost Connect Database dialog.
 * This modal's title changes during the interaction flow (from
 * "How would you like to connect your database?" to "Create a New Database"),
 * so we select the topmost dialog rather than filtering by title.
 */
export function connectDatabaseModal(page: Page): ConnectDatabaseModal {
  return new ConnectDatabaseModal(
    page.locator('[role="dialog"]').last()
  );
}
