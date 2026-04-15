import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The "Extract Columns Into a New Table" dialog — portaled to body, so scoped
 * via a factory rather than a parent Locator.
 *
 * Reached from the Column inspector via `Extract Column(s) Into a New Table`.
 *
 * Mathesar's data grid only supports contiguous (shift-click) multi-selection
 * on column headers — not Ctrl/Cmd-click. So when the caller needs to extract
 * non-adjacent columns, they open the dialog with a single column pre-selected
 * and use the dialog's own `Columns to Extract` MultiSelect field (a
 * `SelectProcessedColumns` component) to add the remaining target columns.
 */
export class ExtractColumnsDialog {
  constructor(private root: Locator) {}

  get tableNameInput() {
    return this.root.getByRole('textbox', { name: 'Name of New Table' });
  }

  get linkColumnNameInput() {
    return this.root.getByRole('textbox', { name: 'Name of Link Column' });
  }

  get createButton() {
    return this.root.getByRole('button', {
      name: 'Create Table and Move Columns',
    });
  }

  get cancelButton() {
    return this.root.getByRole('button', { name: 'Cancel', exact: true });
  }

  /**
   * The `Columns to Extract` MultiSelect trigger (a span.multi-select-trigger).
   * Clicking it opens a portaled listbox of all non-source columns plus a
   * checkmark on the currently-selected ones.
   */
  get columnsMultiSelect() {
    return this.root.locator('.multi-select-trigger');
  }

  /**
   * The dropdown's option list is portaled to body level via
   * `AttachableDropdown`. We anchor on the listbox role that only exists
   * while this dropdown is open.
   */
  private listboxOption(columnName: string) {
    // The option is scoped by a ListBoxOptions component — its items carry
    // role="option". We scope via the page's listbox to avoid matching the
    // primary-key-popover's options.
    return this.root.page()
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`\\b${escapeForRegex(columnName)}\\b`) });
  }

  /** Add a column to the selection via the MultiSelect dropdown. */
  async addColumn(columnName: string): Promise<void> {
    await this.columnsMultiSelect.click();
    await this.listboxOption(columnName).click();
    // Close the dropdown so subsequent interactions outside it aren't
    // intercepted. Clicking the trigger again toggles it closed.
    await this.columnsMultiSelect.click();
  }

  /**
   * Submit the extract form. Ensures the create button is enabled before
   * clicking and waits for the dialog to detach before returning.
   *
   * Extraction runs a SQL migration on the backend that can take tens of
   * seconds on larger tables, so we use an extended timeout on the
   * `toBeHidden` check rather than the 5 s default.
   */
  async submit(params: {
    tableName: string;
    linkColumnName?: string;
  }): Promise<void> {
    await this.tableNameInput.fill(params.tableName);
    if (params.linkColumnName !== undefined) {
      await this.linkColumnNameInput.fill(params.linkColumnName);
    }
    await expect(this.createButton).toBeEnabled();
    await this.createButton.click();
    await expect(this.root).toBeHidden({ timeout: 60_000 });
  }
}

/**
 * Factory: locates the Extract Columns dialog.
 *
 * Anchors on the unique "Create Table and Move Columns" button inside
 * `[role="dialog"]`, so the factory only resolves when this specific dialog
 * is open (and not, e.g., the Move Columns dialog which has a different
 * primary button label).
 */
export function extractColumnsDialog(page: Page): ExtractColumnsDialog {
  return new ExtractColumnsDialog(
    page.locator('[role="dialog"]').filter({
      has: page.getByRole('button', {
        name: 'Create Table and Move Columns',
      }),
    }),
  );
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
