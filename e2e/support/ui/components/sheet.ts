import type { Locator, Page } from '@playwright/test';

function xpathString(text: string): string {
  if (!text.includes('"')) return `"${text}"`;
  return `concat(${text
    .split('"')
    .map((part) => `"${part}"`)
    .join(`, '"', `)})`;
}

/**
 * The spreadsheet-like grid of the table page.
 *
 * Only the rows near the viewport are in the DOM. Use small tables, or filter
 * and sort, to bring a record into view.
 */
export class Sheet {
  readonly columnHeaders: Locator;
  /** Rows that hold a record, saved or not. Group headers are not included. */
  readonly recordRows: Locator;
  readonly placeholderRow: Locator;
  readonly groupHeaders: Locator;
  readonly activeCell: Locator;
  readonly selectedCells: Locator;
  readonly newColumnButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly root: Locator = page.locator('.sheet'),
  ) {
    this.columnHeaders = root.locator(
      '[data-sheet-element="column-header-cell"]',
    );
    this.recordRows = root.locator('[data-sheet-element="data-row"]', {
      has: page.locator(
        '[data-sheet-element="row-header-cell"][data-sheet-row-type="data"]',
      ),
    });
    this.placeholderRow = root.locator('[data-sheet-element="data-row"]', {
      has: page.locator('[data-sheet-row-type="placeholder"]'),
    });
    this.groupHeaders = root.locator('.group-header');
    this.activeCell = root.locator(
      '[data-sheet-element="data-cell"][data-cell-active]',
    );
    this.selectedCells = root.locator(
      '[data-sheet-element="data-cell"][data-cell-selected]',
    );
    this.newColumnButton = root.getByRole('button', { name: 'New Column' });
  }

  columnHeader(name: string): Locator {
    return this.columnHeaders.filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  row(index: number): Locator {
    return this.recordRows.nth(index);
  }

  rowContaining(text: string): Locator {
    return this.recordRows.filter({
      has: this.page.getByText(text, { exact: true }),
    });
  }

  rowHeader(row: number | Locator): Locator {
    return this.resolveRow(row).locator(
      '[data-sheet-element="row-header-cell"]',
    );
  }

  /** The cell of a row that sits under the column header with this name. */
  cell(row: number | Locator, columnName: string): Locator {
    const sheetRoot = 'ancestor::*[.//*[@data-sheet-element="header-row"]][1]';
    const headerText = 'normalize-space(translate(., " ", " "))';
    const columnIdentifier =
      `${sheetRoot}//*[@data-sheet-element="column-header-cell"]` +
      `[${headerText}=${xpathString(columnName)}]/@data-column-identifier`;
    return this.resolveRow(row).locator(
      `xpath=.//*[@data-sheet-element="data-cell"]` +
        `[.//*[@data-column-identifier = ${columnIdentifier}]]`,
    );
  }

  /** Replaces the value of a cell through its inline editor. */
  async editCell(cell: Locator, value: string): Promise<void> {
    await cell.click();
    await this.page.keyboard.press('Enter');
    await cell.locator('input, textarea').fill(value);
    await this.page.keyboard.press('Enter');
  }

  private resolveRow(row: number | Locator): Locator {
    return typeof row === 'number' ? this.row(row) : row;
  }
}
