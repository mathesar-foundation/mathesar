import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ImportPreviewPage {
  constructor(private page: Page) {}

  get heading() {
    return this.page.getByRole('heading', {
      name: 'Finish setting up your table',
    });
  }

  get tableNameInput() { return this.page.getByRole('textbox', { name: 'Table Name' }); }
  get confirmButton() { return this.page.getByRole('button', { name: 'Confirm & create table' }); }
  get cancelButton() { return this.page.getByRole('button', { name: 'Cancel' }).first(); }
  get primaryKeyButton() { return this.page.getByRole('button', { name: 'Primary Key Column' }); }

  /** Column header region for a given column by its display name. */
  column(name: string): ImportPreviewColumn {
    return new ImportPreviewColumn(this.page, name);
  }

  /**
   * The preview fetches and renders columns asynchronously after the heading
   * appears. The `Confirm & create table` button is only enabled after columns
   * finish loading, which makes it a reliable readiness signal.
   */
  async waitForLoaded() {
    await expect(this.confirmButton).toBeEnabled();
  }
}

export class ImportPreviewColumn {
  constructor(private page: Page, private name: string) {}

  /** All column header cells in the preview, in display order. */
  private get headerCells(): Locator {
    return this.page.locator('[data-sheet-element="column-header-cell"]');
  }

  /**
   * Opens the type editor for this column.
   *
   * Svelte's `bind:value` sets the input's `value` property but not its
   * attribute, so we can't match the column by attribute selectors or by
   * Playwright's `hasText` filter. Instead we iterate over header cells and
   * check each input's live value via `inputValue()`.
   */
  async openTypeEditor() {
    const count = await this.headerCells.count();
    for (let i = 0; i < count; i++) {
      const cell = this.headerCells.nth(i);
      // Each column header has a checkbox and a text input — we want the latter.
      const value = await cell.locator('input[type="text"]').inputValue();
      if (value === this.name) {
        // Mathesar's `Dropdown` trigger renders as a button with class
        // `column-type` (passed via `triggerClass`).
        await cell.locator('button.column-type').click();
        return;
      }
    }
    throw new Error(
      `Column "${this.name}" not found in the import preview header`,
    );
  }
}

/**
 * The type editor popover that appears when a column's type button is clicked.
 * It is portaled near body level, so we scope it via a factory function (like
 * `connectDatabaseModal`). We anchor on the `Save` button, which only exists
 * inside this popover.
 */
export class TypeEditorPopover {
  constructor(private root: Locator) {}

  get dataTypeButton() { return this.root.getByRole('button', { name: 'Data Type' }); }
  get saveButton() { return this.root.getByRole('button', { name: 'Save' }); }
  get cancelButton() { return this.root.getByRole('button', { name: 'Cancel' }); }

  /**
   * The type options listbox is rendered at page root (outside the popover),
   * so we query via the root's page.
   */
  typeOption(typeName: string) {
    return this.root.page().getByRole('option', { name: new RegExp('^' + typeName) });
  }

  async selectType(typeName: string) {
    await this.dataTypeButton.click();
    await this.typeOption(typeName).click();
  }

  async save() {
    await this.saveButton.click();
  }
}

export function typeEditorPopover(page: Page): TypeEditorPopover {
  // Mathesar's `AttachableDropdown` portals content to body and marks the
  // wrapper with `data-attachable-dropdown`. We scope by that attribute and
  // further filter to the dropdown that contains the `Data Type` label, which
  // is unique to the type editor.
  return new TypeEditorPopover(
    page
      .locator('[data-attachable-dropdown]')
      .filter({ has: page.getByRole('button', { name: 'Data Type' }) }),
  );
}

/**
 * The Primary Key Column popover inside the import-preview form.
 *
 * Two strategies are supported (via the Strategy dropdown):
 *   - "Add a new primary key column" — create an auto-incrementing PK column.
 *   - "Choose an existing column for the primary key" — reuse a CSV column.
 *
 * When the "existing" strategy is picked, a Column dropdown appears that
 * lists every detected CSV column. The user then clicks
 * "Update primary key column" to commit the choice.
 *
 * The popover is an inline expandable section on the preview form (not
 * portaled). Each of its buttons — Strategy, Column, Update, Discard —
 * is unique on the page during the import preview flow, so we rely on
 * page-level role queries rather than a narrow scope.
 */
export class PrimaryKeyPopover {
  constructor(private page: Page) {}

  get strategyButton() { return this.page.getByRole('button', { name: 'Strategy' }); }
  get columnButton() { return this.page.getByRole('button', { name: 'Column', exact: true }); }
  get updateButton() { return this.page.getByRole('button', { name: 'Update primary key column' }); }
  get discardButton() { return this.page.getByRole('button', { name: 'Discard Changes' }); }

  strategyOption(name: 'Add a new primary key column' | 'Choose an existing column for the primary key') {
    return this.page.getByRole('option', { name });
  }

  columnOption(name: string) {
    return this.page.getByRole('option', { name: new RegExp(`\\b${name}\\b`) });
  }

  async chooseExistingColumn(columnName: string) {
    await this.strategyButton.click();
    await this.strategyOption('Choose an existing column for the primary key').click();
    await this.columnButton.click();
    await this.columnOption(columnName).click();
    await this.updateButton.click();
  }
}

/** Factory: the PK popover is inline on the import-preview page. */
export function primaryKeyPopover(page: Page): PrimaryKeyPopover {
  return new PrimaryKeyPopover(page);
}
