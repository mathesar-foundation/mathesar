import { type Locator, type Page, expect } from '@playwright/test';

import { fillFormattedInput } from './formatted-input';

function xpathString(text: string): string {
  if (!text.includes('"')) return `"${text}"`;
  return `concat(${text
    .split('"')
    .map((part) => `"${part}"`)
    .join(`, '"', `)})`;
}

/**
 * The spreadsheet-like grid of the table page. Only the rows near the viewport are in
 * the DOM: use small tables, or scroll, filter or sort to bring a record into view.
 */
export class Sheet {
  readonly columnHeaders: Locator;
  /** Rows that hold a record, saved or not. Group headers are not included. */
  readonly recordRows: Locator;
  readonly placeholderRow: Locator;
  /** Rows whose record the database refused to store. */
  readonly failedRows: Locator;
  readonly groupHeaders: Locator;
  /** The note that separates added records from the fetched ones. */
  readonly newRecordsNote: Locator;
  readonly activeCell: Locator;
  /** In reading order: row by row, left to right. */
  readonly selectedCells: Locator;
  /** The input of the cell that is being edited. */
  readonly editor: Locator;
  /** The messages shown for a cell whose value could not be saved. */
  readonly cellErrors: Locator;
  readonly originCell: Locator;
  readonly newColumnButton: Locator;
  readonly scroller: Locator;
  /** The rows area of the sheet. It can take the focus, away from the cells. */
  readonly body: Locator;

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
    this.failedRows = root.locator('[data-sheet-element="data-row"].failed');
    this.groupHeaders = root.locator('.group-header');
    this.newRecordsNote = root.getByText(
      'New records will be repositioned on refresh',
    );
    this.activeCell = root.locator(
      '[data-sheet-element="data-cell"][data-cell-active]',
    );
    this.selectedCells = root.locator(
      '[data-sheet-element="data-cell"][data-cell-selected]',
    );
    this.editor = root
      .locator('.cell-wrapper.is-edit-mode')
      .locator('input, textarea');
    this.cellErrors = page.locator('.errors');
    this.originCell = root.locator('[data-sheet-element="origin-cell"]');
    this.newColumnButton = root.getByRole('button', { name: 'New Column' });
    this.scroller = root.locator('[data-sheet-body-element="list"]');
    this.body = root.locator('[data-sheet-element="body"]');
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
    const sheetRoot = 'ancestor::*[./*[@data-sheet-element="header-row"]][1]';
    const headerText = 'normalize-space(translate(., " ", " "))';
    const columnIdentifier =
      `${sheetRoot}//*[@data-sheet-element="column-header-cell"]` +
      `[${headerText}=${xpathString(columnName)}]/@data-column-identifier`;
    return this.resolveRow(row).locator(
      `xpath=.//*[@data-sheet-element="data-cell"]` +
        `[.//*[@data-column-identifier = ${columnIdentifier}]]`,
    );
  }

  /** The cell of the empty row at the end, which adds a record when edited. */
  placeholderCell(columnName: string): Locator {
    return this.cell(this.placeholderRow, columnName);
  }

  /** The icon of a column header that names the data type of the column. */
  columnTypeIcon(columnName: string): Locator {
    return this.columnHeader(columnName).getByRole('img');
  }

  /** The link in a primary key cell that opens the record. */
  recordLink(row: number | Locator): Locator {
    return this.resolveRow(row).getByRole('link');
  }

  /**
   * Drags the right edge of a column. Only the half of the handle that lies
   * inside its own column receives the mouse.
   */
  async dragColumnEdge(columnName: string, byPixels: number): Promise<void> {
    const handle = this.resizeHandle(columnName);
    const box = await handle.boundingBox();
    if (!box) throw new Error(`Column "${columnName}" has no resize handle`);
    const start = { x: box.x + 3, y: box.y + box.height / 2 };
    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(start.x + byPixels, start.y, { steps: 5 });
    await this.page.mouse.up();
  }

  resizeHandle(columnName: string): Locator {
    return this.columnHeader(columnName).locator('.column-resizer');
  }

  /** A column header can be dragged once its column is selected. */
  async dragColumnHeader(columnName: string, onto: string): Promise<void> {
    await this.columnHeader(columnName)
      .locator('.draggable')
      .dragTo(this.columnHeader(onto));
  }

  /** A selected column dropped on the corner cell moves to the front. */
  async dragColumnHeaderToCorner(columnName: string): Promise<void> {
    await this.columnHeader(columnName)
      .locator('.draggable')
      .dragTo(this.originCell);
  }

  errorIndicator(cell: Locator): Locator {
    return cell.locator('.error-indicator');
  }

  /** Replaces the value of a cell through its inline editor. */
  async editCell(cell: Locator, value: string): Promise<void> {
    await cell.click();
    await this.page.keyboard.press('Enter');
    await this.editor.fill(value);
    await this.page.keyboard.press('Enter');
  }

  /** `editCell` for an editor that formats what the user types, such as a number or a date. */
  async editFormattedCell(cell: Locator, value: string): Promise<void> {
    await cell.click();
    await this.page.keyboard.press('Enter');
    await fillFormattedInput(this.editor, value);
    await this.page.keyboard.press('Enter');
  }

  async dragBetween(from: Locator, to: Locator): Promise<void> {
    await from.hover();
    await this.page.mouse.down();
    await to.hover();
    await this.page.mouse.up();
  }

  /**
   * Right-clicks where a cell is, also while an open context menu covers the
   * sheet and takes the click.
   */
  async rightClickAt(cell: Locator): Promise<void> {
    const box = await cell.boundingBox();
    if (!box) throw new Error('The cell is not on the page');
    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
      button: 'right',
    });
  }

  /** The frame drawn around the active cell. It is stronger while the cell has the focus. */
  activeCellIndicator(): Locator {
    return this.activeCell.locator('.active-indicator');
  }

  /** The moving frame of the active cell while "Select Cell Range" waits for the end of the range. */
  cellRangeIndicator(): Locator {
    return this.activeCell.locator('.active-indicator.is-selecting-cell-range');
  }

  /** The element of a cell that holds the keyboard focus while the cell is not edited. */
  focusTarget(cell: Locator): Locator {
    return cell.locator('.cell-wrapper');
  }

  /** Keyboard use of the sheet needs the focus to be on the active cell. */
  async expectFocusOnActiveCell(): Promise<void> {
    await expect(this.focusTarget(this.activeCell)).toBeFocused();
  }

  /** How far the records are scrolled down, in pixels. */
  async scrollTop(): Promise<number> {
    return this.scroller.evaluate((list) => list.scrollTop);
  }

  private resolveRow(row: number | Locator): Locator {
    return typeof row === 'number' ? this.row(row) : row;
  }
}
