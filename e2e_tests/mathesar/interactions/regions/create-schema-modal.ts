import type { Page } from '@playwright/test';
import { Modal } from '../components/modal';

/**
 * The "Create Schema" dialog — portaled to body, so scoped via the modal
 * factory pattern rather than a parent Locator.
 */
export class CreateSchemaModal extends Modal {
  get nameInput() { return this.content.getByRole('textbox', { name: 'Name' }); }
  get descriptionInput() { return this.content.getByRole('textbox', { name: 'Description' }); }
  get createButton() { return this.content.getByRole('button', { name: 'Create New Schema' }); }

  async createSchema(name: string, description?: string) {
    await this.nameInput.fill(name);
    if (description) {
      await this.descriptionInput.fill(description);
    }
    await this.createButton.click();
  }
}

/**
 * Factory: locates the Create Schema dialog by its title.
 */
export function createSchemaModal(page: Page): CreateSchemaModal {
  return new CreateSchemaModal(
    page.locator('[role="dialog"]').filter({
      has: page.locator('[data-window-area="title"]').filter({ hasText: 'Create Schema' }),
    }),
  );
}
