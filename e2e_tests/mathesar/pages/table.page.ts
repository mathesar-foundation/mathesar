import type { Page, Locator } from '@playwright/test';

export class TablePage {
  private page: Page;
  readonly heading: Locator;
  readonly newRecordButton: Locator;
  readonly newColumnButton: Locator;
  readonly filterButton: Locator;
  readonly sortButton: Locator;
  readonly groupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.newRecordButton = page.getByRole('button', { name: 'New Record' });
    this.newColumnButton = page.getByRole('button', { name: 'New Column' });
    this.filterButton = page.getByRole('button', { name: 'Filter' });
    this.sortButton = page.getByRole('button', { name: 'Sort' });
    this.groupButton = page.getByRole('button', { name: 'Group' });
  }

  columnHeader(name: string): Locator {
    return this.page
      .locator('[data-sheet-element="column-header-cell"]')
      .filter({ hasText: name });
  }

  dataRow(index: number): Locator {
    return this.page
      .locator('[data-sheet-element="data-row"]')
      .nth(index);
  }

  lastDataRow(): Locator {
    return this.page
      .locator('[data-sheet-element="data-row"]')
      .last();
  }

  dataCell(row: Locator, columnIndex: number): Locator {
    return row
      .locator('[data-sheet-element="data-cell"]')
      .nth(columnIndex);
  }
}
