import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

/** The constraints of a table, opened from "Advanced" in the inspector of the table page. */
export class ConstraintsModal extends Modal {
  constructor(private readonly page: Page) {
    super(page, 'Constraints');
  }

  /** The button that deletes the constraint on a column. It has no accessible name. */
  deleteButton(columnName: string): Locator {
    return this.body
      .locator('.collapsible-header')
      .filter({ has: this.page.getByText(columnName, { exact: true }) })
      .getByRole('button')
      .last();
  }

  deleteConfirmation(constraintName: string): Modal {
    return new Modal(this.page, `Delete Constraint ${constraintName}?`);
  }
}
