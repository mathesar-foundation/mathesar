import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The "Move Columns To Linked Table" dialog — portaled to body.
 *
 * Reached from the Column inspector's `Move Columns To Linked Table` button,
 * which only renders when the current table has outgoing foreign keys.
 * Unlike the extract dialog, this one doesn't create a new table — it lets
 * the user pick one of the existing linked tables and move the selected
 * columns into it.
 *
 * Like the extract dialog, this dialog contains a `Columns to Move`
 * MultiSelect that lets the caller add extra columns to the set of columns
 * pre-selected in the grid. This is necessary because Mathesar's grid only
 * supports contiguous (shift-click) multi-select on column headers.
 */
export class MoveColumnsDialog {
  constructor(private root: Locator) {}

  /**
   * The linked-table selector. It's a Mathesar dropdown trigger button
   * labeled "Linked Table".
   */
  get linkedTableButton() {
    return this.root.getByRole('button', { name: 'Linked Table' });
  }

  /**
   * The option list for the linked-table dropdown is rendered at the page
   * root (outside the dialog), so we query via the root's page.
   *
   * Options are rendered as "<TableName> via <FkColumnName>" (e.g.
   * "Customers via Customer"), so we match by anchoring on the table name
   * at the start of the option text.
   */
  linkedTableOption(name: string) {
    return this.root
      .page()
      .getByRole('option', { name: new RegExp('^' + escapeForRegex(name) + '\\b') });
  }

  get moveButton() {
    return this.root.getByRole('button', { name: 'Move Columns', exact: true });
  }

  get cancelButton() {
    return this.root.getByRole('button', { name: 'Cancel', exact: true });
  }

  /** The `Columns to Move` MultiSelect trigger. */
  get columnsMultiSelect() {
    return this.root.locator('.multi-select-trigger');
  }

  private listboxOption(columnName: string) {
    return this.root.page()
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`\\b${escapeForRegex(columnName)}\\b`) });
  }

  async addColumn(columnName: string): Promise<void> {
    await this.columnsMultiSelect.click();
    await this.listboxOption(columnName).click();
    await this.columnsMultiSelect.click();
  }

  /**
   * Pick a linked table and submit. Waits for the dialog to detach.
   *
   * The backend move runs a SQL migration that can take tens of seconds
   * on larger tables, so we use an extended timeout rather than the 5 s
   * default.
   */
  async submit(params: { linkedTableName: string }): Promise<void> {
    await this.linkedTableButton.click();
    await this.linkedTableOption(params.linkedTableName).click();
    await expect(this.moveButton).toBeEnabled();
    await this.moveButton.click();
    await expect(this.root).toBeHidden({ timeout: 60_000 });
  }
}

/**
 * Factory: locates the Move Columns dialog.
 *
 * Anchors on the unique `Move Columns` primary button inside a `[role="dialog"]`.
 * We use `exact: true` because "Move Columns To Linked Table" is a superstring
 * that appears elsewhere — we want only the dialog whose primary button text
 * is exactly "Move Columns".
 */
export function moveColumnsDialog(page: Page): MoveColumnsDialog {
  return new MoveColumnsDialog(
    page.locator('[role="dialog"]').filter({
      has: page.getByRole('button', { name: 'Move Columns', exact: true }),
    }),
  );
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
