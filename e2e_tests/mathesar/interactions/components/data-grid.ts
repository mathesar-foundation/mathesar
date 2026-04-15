import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class DataGrid {
  constructor(private root: Locator) {}

  // --- Locators ---
  get newRecordButton() { return this.root.getByRole('button', { name: 'New Record' }); }
  get unsavedIndicator() { return this.root.getByText('unsaved'); }
  get rows() { return this.root.locator('[data-sheet-element="data-row"]'); }

  // --- Child regions ---
  row(index: number) {
    return new DataRow(this.root.locator('[data-sheet-element="data-row"]').nth(index));
  }

  draftRow() {
    return new DataRow(
      this.root.locator('[data-sheet-element="data-row"]')
        .filter({ hasText: 'DEFAULT' }).first()
    );
  }

  rowContaining(text: string) {
    return new DataRow(
      this.root.locator('[data-sheet-element="data-row"]').filter({ hasText: text })
    );
  }

  columnHeader(name: string) {
    return this.root
      .locator('[data-sheet-element="column-header-cell"]')
      .filter({ hasText: name });
  }

  // --- Actions ---
  async addRecord() { await this.newRecordButton.click(); }

  /**
   * Click a column header to select that column. The table-view wires
   * `on:mousedown` on the header to open the Column tab of the inspector.
   *
   * Note: Mathesar's grid only extends a selection via Shift-click
   * (contiguous range). Ctrl/Cmd-click is a no-op. If a caller needs to
   * act on a non-contiguous set of columns, they should select a single
   * column here and add the rest via whatever flow they're entering
   * (e.g., the `Columns to Extract` MultiSelect in the extract dialog).
   */
  async selectColumn(name: string): Promise<void> {
    await this.columnHeader(name).click();
  }

  // --- State observations ---
  async waitForSaved() { await expect(this.unsavedIndicator).toBeHidden(); }
}

export class DataRow {
  constructor(private root: Locator) {}

  get element() { return this.root; }

  cell(index: number) {
    return new DataCell(this.root.locator('[data-sheet-element="data-cell"]').nth(index));
  }
}

export class DataCell {
  constructor(private root: Locator) {}

  get element() { return this.root; }

  async edit(value: string) {
    await this.root.dblclick();
    await this.root.page().keyboard.type(value);
    await this.root.page().keyboard.press('Tab');
  }
}
