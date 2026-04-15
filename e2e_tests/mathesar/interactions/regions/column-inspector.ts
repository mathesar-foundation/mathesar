import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The Column tab panel inside the table inspector.
 *
 * Rendered when one or more column headers are selected in the data grid.
 * Exposes:
 *  - Column Name editor (renames via `EditableTextWithActions` — commits on
 *    explicit Save click, not blur or Enter).
 *  - Actions: `Extract Column(s) Into a New Table` and, when the current
 *    table has any linked foreign keys, `Move Columns To Linked Table`.
 *
 * Scoped to the tab panel whose role=tabpanel and name is "Column", so queries
 * don't leak into the main table area (which also lives on the page).
 */
export class ColumnInspector {
  constructor(private root: Locator) {}

  // ---------- Column Name / Description ----------

  /** The EditableTextWithActions row for the column name. */
  private get columnNameRow() {
    return this.root.locator('.column-name');
  }

  get columnNameInput() {
    return this.columnNameRow.getByRole('textbox');
  }

  get columnNameSaveButton() {
    return this.columnNameRow.getByRole('button', { name: 'Save', exact: true });
  }

  get columnNameCancelButton() {
    return this.columnNameRow.getByRole('button', { name: 'Cancel', exact: true });
  }

  // ---------- Selection state ----------

  /**
   * The "N columns selected" label shown when more than one column is
   * selected. Hidden when only a single column is selected.
   */
  selectionSummary(count: number) {
    return this.root.getByText(`${count} columns selected`);
  }

  // ---------- Actions ----------

  /**
   * `Extract Column Into a New Table` (singular when 1 column selected) or
   * `Extract Columns Into a New Table` (plural when 2+ selected).
   */
  get extractButton() {
    return this.root.getByRole('button', {
      name: /Extract Columns? Into a New Table/,
    });
  }

  /**
   * Only rendered when the current table has at least one outgoing FK.
   */
  get moveButton() {
    return this.root.getByRole('button', {
      name: /Move Columns? To Linked Table/,
    });
  }

  // ---------- Observations ----------

  /** Readiness: wait until the column-name input is visible. */
  async waitForLoaded() {
    await expect(this.columnNameInput).toBeVisible();
  }
}

/**
 * Factory: locates the Column tab panel of the table inspector.
 * The panel only exists when the Column tab is selected (which happens
 * automatically when a column header is clicked).
 */
export function columnInspector(page: Page): ColumnInspector {
  return new ColumnInspector(
    page.getByRole('tabpanel', { name: 'Column', exact: true }),
  );
}
