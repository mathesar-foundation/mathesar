import type { Locator, Page } from '@playwright/test';

import { Modal } from '../components/modal';
import { MultiSelect } from '../components/multi-select';

/**
 * The form behind "Extract Column Into a New Table" and "Move Column To
 * Linked Table" in the Column tab of the inspector.
 */
export class ExtractColumnsModal extends Modal {
  /** Only when the columns go to a new table. */
  readonly newTableName: Locator;
  readonly linkColumnName: Locator;
  /** Only when the columns go to a linked table. A custom select: use `chooseOption`. */
  readonly linkedTable: Locator;
  /** Starts with the columns that are selected in the sheet, and changes that selection. */
  readonly columns: MultiSelect;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(
      page,
      /^(Extract Columns? Into a New Table|Move Columns? To Linked Table)$/,
    );
    this.newTableName = this.body.getByRole('textbox', {
      name: 'Name of New Table',
    });
    this.linkColumnName = this.body.getByRole('textbox', {
      name: 'Name of Link Column',
    });
    this.linkedTable = this.body.getByRole('button', { name: 'Linked Table' });
    this.columns = new MultiSelect(this.body.locator('.multi-select-trigger'));
    this.submitButton = this.footer.getByRole('button', {
      name: /^(Create Table and Move Columns|Move Columns)$/,
    });
    this.cancelButton = this.footer.getByRole('button', { name: 'Cancel' });
  }
}
