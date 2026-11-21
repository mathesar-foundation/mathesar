import type { Locator, Page } from '@playwright/test';

/** The form that the "+" header cell of the sheet opens to add a column. */
export class NewColumnDropdown {
  readonly root: Locator;
  readonly name: Locator;
  readonly typeList: Locator;
  readonly addButton: Locator;
  readonly cancelButton: Locator;
  /** The messages of the name field. */
  readonly nameErrors: Locator;
  /** The error of the server, under the buttons. */
  readonly submitErrors: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ has: page.locator('.new-column-dropdown') });
    this.name = this.root.getByLabel('Column Name');
    this.typeList = this.root.getByRole('listbox');
    this.addButton = this.root.getByRole('button', { name: 'Add' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
    this.nameErrors = this.root.locator('.field-errors');
    this.submitErrors = this.root.locator('.form-submit .errors');
  }

  /** The accessible name of an option also holds the name of its icon. */
  type(name: string): Locator {
    return this.typeList
      .getByRole('option')
      .filter({ has: this.root.page().getByText(name, { exact: true }) });
  }
}
