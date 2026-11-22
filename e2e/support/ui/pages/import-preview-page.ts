import { type Locator, type Page, expect } from '@playwright/test';

import type { Table } from '../../api/mathesar';
import { chooseOption } from '../components/select';
import { tooltip } from '../components/tooltip';
import { schemaUrl } from '../urls';

/** A column of the preview: the controls above its values. None of them has an accessible name. */
export class PreviewColumn {
  readonly name: Locator;
  /** The checkbox that keeps the column in the table. */
  readonly included: Locator;
  /** Shows the data type and opens the options to change it. */
  readonly type: Locator;
  /**
   * The marks above the name, each with a tooltip. In this order, as far as
   * they apply: primary key, added by Mathesar, renamed from "id".
   */
  readonly marks: Locator;
  /** The right edge, which changes the width of the column when dragged. */
  readonly resizer: Locator;

  constructor(readonly root: Locator) {
    this.name = root.getByRole('textbox');
    this.included = root.getByRole('checkbox');
    this.type = root.getByRole('button');
    this.marks = root.getByLabel('Help');
    this.resizer = root.locator('.column-resizer');
  }
}

/** The panel under the type of a column that changes its data type. */
export class ColumnTypeOptions {
  readonly root: Locator;
  /** A custom select. An option is named twice: by its icon and by its label. */
  readonly dataType: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: 'Database Type' });
    this.dataType = this.root.getByRole('button', { name: 'Data Type' });
    this.saveButton = this.root.getByRole('button', { name: 'Save' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }

  async choose(type: string): Promise<void> {
    await chooseOption(this.dataType, `${type} ${type}`);
  }
}

/** The collapsed section that sets the primary key of the new table. */
export class PrimaryKeyConfig {
  readonly toggle: Locator;
  /** The four custom selects. Choose from them with `chooseOption`. */
  readonly strategy: Locator;
  readonly columnType: Locator;
  readonly column: Locator;
  readonly defaultValue: Locator;
  readonly noDefaultWarning: Locator;
  readonly discardButton: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    const select = (name: string): Locator =>
      page.getByRole('button', { name, exact: true });
    this.toggle = page.getByRole('button', { name: 'Primary Key Column' });
    this.strategy = select('Strategy');
    this.columnType = select('Column Type');
    this.column = select('Column');
    this.defaultValue = select('Default Value');
    this.noDefaultWarning = page.getByText('Heads up:');
    this.discardButton = page.getByRole('button', { name: 'Discard Changes' });
    this.updateButton = page.getByRole('button', {
      name: 'Update primary key column',
    });
  }
}

/** The page that shows an imported file as a table before the user confirms it. */
export class ImportPreviewPage {
  readonly heading: Locator;
  readonly tableName: Locator;
  readonly tableNameErrors: Locator;
  readonly headerRowOption: Locator;
  readonly genericNamesOption: Locator;
  readonly inferTypesOption: Locator;
  readonly allTextOption: Locator;
  readonly primaryKey: PrimaryKeyConfig;
  readonly columns: Locator;
  readonly columnTypes: Locator;
  readonly typeOptions: ColumnTypeOptions;
  readonly rows: Locator;
  /** The values of all rows, row by row. */
  readonly cells: Locator;
  readonly truncationNote: Locator;
  readonly tooltip: Locator;
  /** Replaces the preview, or the whole form when the import cannot be loaded. */
  readonly error: Locator;
  readonly retryButton: Locator;
  readonly deleteImportButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;
  readonly cleaningUpNote: Locator;

  constructor(private readonly page: Page) {
    const main = page.getByRole('main');
    const columnNames = main.getByRole('group', { name: 'Column Names' });
    const dataTypes = main.getByRole('group', { name: 'Column Data Types' });
    const preview = main.locator('.import-preview');
    this.heading = page.getByRole('heading', { level: 1 });
    this.tableName = main.getByLabel('Table Name');
    this.tableNameErrors = main
      .locator('.field')
      .filter({ has: page.getByLabel('Table Name') })
      .locator('.field-errors');
    this.headerRowOption = columnNames.getByRole('radio', {
      name: 'Take the first row as column names',
    });
    this.genericNamesOption = columnNames.getByRole('radio', {
      name: 'Set generic column names, keeping the first row as data',
    });
    this.inferTypesOption = dataTypes.getByRole('radio', {
      name: /^Pick the best data type for each column/,
    });
    this.allTextOption = dataTypes.getByRole('radio', {
      name: /^Use "Text" for all column data types/,
    });
    this.primaryKey = new PrimaryKeyConfig(page);
    this.columns = preview.locator('[data-sheet-element="column-header-cell"]');
    this.columnTypes = this.columns.getByRole('button');
    this.typeOptions = new ColumnTypeOptions(page);
    this.rows = preview.locator('[data-sheet-element="data-row"]');
    this.cells = this.rows.locator('[data-sheet-element="data-cell"]');
    this.truncationNote = main.getByText('(Preview is truncated at 20 rows)');
    this.tooltip = tooltip(page);
    this.error = main.locator('.error-box');
    this.retryButton = this.error.getByRole('button', { name: 'Retry' });
    this.deleteImportButton = this.error.getByRole('button', {
      name: 'Delete Import',
    });
    this.cancelButton = main.getByRole('button', { name: 'Cancel' });
    this.confirmButton = main.getByRole('button', {
      name: 'Confirm & create table',
    });
    this.cleaningUpNote = main.getByText('Cleaning up...');
  }

  /** `oid` is all that the page needs of the table: its name can change before the import is confirmed. */
  url(table: Pick<Table, 'oid' | 'schema'>, inference = true): string {
    return `${schemaUrl(table.schema)}import/${table.oid}/?inference=${inference}`;
  }

  async goto(
    table: Pick<Table, 'oid' | 'schema'>,
    inference = true,
  ): Promise<void> {
    await this.page.goto(this.url(table, inference));
  }

  /** A column by its position in the preview, from 0. */
  column(position: number): PreviewColumn {
    return new PreviewColumn(this.columns.nth(position));
  }

  /** Asserts the name and the data type of every column, from left to right. */
  async expectColumns(columns: [name: string, type: string][]): Promise<void> {
    await expect(this.columnTypes).toHaveText(columns.map(([, type]) => type));
    for (const [position, [name]] of columns.entries()) {
      await expect(this.column(position).name).toHaveValue(name);
    }
  }

  /**
   * Asserts the columns after a change that loads the preview again. The
   * radios stay disabled until the reload has ended, Confirm does not.
   */
  async expectColumnsReloaded(
    columns: [name: string, type: string][],
  ): Promise<void> {
    await this.expectColumns(columns);
    await expect(this.inferTypesOption).toBeEnabled();
  }

  /** Changes the data type of a column through its type options. */
  async changeType(column: PreviewColumn, type: string): Promise<void> {
    await column.type.click();
    await this.typeOptions.choose(type);
    await this.typeOptions.saveButton.click();
  }

  /** The OID of the table in the URL. A change of the header row replaces the table. */
  tableOid(): number {
    const [, oid] = /\/import\/(\d+)\//.exec(this.page.url()) ?? [];
    return Number(oid);
  }
}
