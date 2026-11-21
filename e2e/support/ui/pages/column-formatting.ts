import type { Locator } from '@playwright/test';

import { chooseOption } from '../components/select';
import type { TableInspector } from './table-page';

/**
 * The Formatting section of the Column tab of the table inspector. It changes
 * how the cells of a column show their values, not the values.
 */
export class ColumnFormatting {
  readonly section: Locator;
  /** Cancel and Save show once the section has been clicked. */
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  /** Shown instead of options for data types that have none. */
  readonly noOptionsNote: Locator;

  constructor(inspector: TableInspector) {
    this.section = inspector.panel.locator('.inspector-section').filter({
      has: inspector.panel
        .page()
        .getByRole('button', { name: 'Formatting', exact: true }),
    });
    this.cancelButton = this.section.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.section.getByRole('button', { name: 'Save' });
    this.noOptionsNote = this.section.getByText(
      'No formatting option for the column data type',
    );
  }

  /** A text field, checkbox or select of the section, by its label. */
  field(label: string): Locator {
    return this.section.getByLabel(label, { exact: true });
  }

  async choose(label: string, option: string | RegExp): Promise<void> {
    await chooseOption(this.field(label), option);
  }
}
