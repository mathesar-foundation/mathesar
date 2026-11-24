import type { Locator, Page } from '@playwright/test';

/** One piece of a record summary: the value of a column or a fixed text. */
export class SummaryPart {
  /** The text of a text part. */
  readonly text: Locator;
  /**
   * The selects of a column part. The first holds a column of the table. For
   * a column that links to a table, the next holds a column of that table.
   */
  readonly columnSelects: Locator;
  /** It has no accessible name. */
  readonly deleteButton: Locator;
  /** Drag it up or down with the mouse to move the part. */
  readonly grip: Locator;

  constructor(readonly root: Locator) {
    this.text = root.getByRole('textbox');
    this.columnSelects = root.locator('.column-select').getByRole('button');
    this.deleteButton = root.locator('.delete').getByRole('button');
    this.grip = root.locator('.grip');
  }
}

/**
 * The editor of the record summary of a table: in the inspector of the table
 * page by default, and in the field inspector of the form builder.
 */
export class RecordSummaryEditor {
  readonly useDefault: Locator;
  readonly customizeFields: Locator;
  readonly parts: Locator;
  readonly noPartsNote: Locator;
  /** Opens a menu with "Column" and "Text". */
  readonly addFieldButton: Locator;
  /** Why the summary cannot be saved, or why the table has none to configure. */
  readonly error: Locator;
  /** The summary of the record that is selected in the sheet, with the unsaved changes. */
  readonly preview: Locator;
  /** Appears with the first change, next to "Reset". */
  readonly saveButton: Locator;
  readonly resetButton: Locator;

  constructor(
    private readonly page: Page,
    readonly root: Locator = page.locator(
      '.table-inspector .record-summary-config',
    ),
  ) {
    this.useDefault = this.root.getByRole('radio', { name: 'Use Default' });
    this.customizeFields = this.root.getByRole('radio', {
      name: 'Customize Fields',
    });
    this.parts = this.root.locator('.part');
    this.noPartsNote = this.root.getByText('No fields added yet');
    this.addFieldButton = this.root.getByRole('button', { name: 'Add Field' });
    this.error = this.root.locator('.error-box');
    this.preview = this.root
      .getByRole('group', { name: 'Preview' })
      .locator('.linked-record');
    this.saveButton = this.root.getByRole('button', { name: 'Save' });
    this.resetButton = this.root.getByRole('button', { name: 'Reset' });
  }

  part(index: number): SummaryPart {
    return new SummaryPart(this.parts.nth(index));
  }

  /** Moves a part with the mouse so that it takes the place of another part. */
  async dragPart(from: number, to: number): Promise<void> {
    const grip = await this.part(from).grip.boundingBox();
    const target = await this.parts.nth(to).boundingBox();
    if (!grip || !target) throw new Error('The summary part is not on screen');
    const x = grip.x + grip.width / 2;
    // The dragged part moves once its leading edge passes the middle of the target.
    const targetY = to < from ? target.y + 2 : target.y + target.height - 2;
    await this.page.mouse.move(x, grip.y + grip.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(x, targetY, { steps: 10 });
    await this.page.mouse.up();
  }
}
