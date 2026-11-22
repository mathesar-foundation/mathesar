import type { Locator, Page } from '@playwright/test';

import type { TablePage } from '../pages/table-page';
import { columnMenuItem } from './column-options';

/** One sort column of the Sort dropdown. */
export class SortEntry {
  readonly column: Locator;
  readonly direction: Locator;
  readonly removeButton: Locator;
  readonly dragHandle: Locator;

  constructor(readonly root: Locator) {
    const selects = root.locator('[aria-haspopup="listbox"]');
    this.column = selects.nth(0);
    this.direction = selects.nth(1);
    this.removeButton = root.getByRole('button').last();
    this.dragHandle = root.locator('[data-sortable-trigger]');
  }
}

/** The Sort dropdown of the table page: a menu of columns at first, then the list of sort columns. */
export class SortDropdown {
  readonly trigger: Locator;
  /** The list of sort columns. Not there while the dropdown shows the menu of columns. */
  readonly panel: Locator;
  /** In order of priority. */
  readonly entries: Locator;
  readonly addButton: Locator;
  private readonly page: Page;

  constructor(tablePage: TablePage) {
    this.page = tablePage.page;
    this.trigger = tablePage.toolbarButton('Sort');
    this.panel = this.page
      .locator('[data-attachable-dropdown]')
      .filter({ has: this.page.locator('[data-sortable-container]') });
    this.entries = this.panel.locator('[data-sortable-item]');
    this.addButton = this.panel.getByRole('button', {
      name: 'Add new sort condition',
    });
  }

  entry(index: number): SortEntry {
    return new SortEntry(this.entries.nth(index));
  }

  /** Opens the dropdown of a table without sorting and picks a column from its menu. */
  async addFirstEntry(columnName: string): Promise<void> {
    await this.trigger.click();
    await columnMenuItem(this.page, columnName).click();
  }

  async addEntry(columnName: string): Promise<void> {
    await this.addButton.click();
    await columnMenuItem(this.page, columnName).click();
  }

  /** Drags an entry by its handle to the place of another entry. */
  async dragEntry(from: number, to: number): Promise<void> {
    const handle = await this.entry(from).dragHandle.boundingBox();
    const source = await this.entries.nth(from).boundingBox();
    const target = await this.entries.nth(to).boundingBox();
    if (!handle || !source || !target) throw new Error('No such sort entry');
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + target.y - source.y, { steps: 8 });
    await this.page.mouse.up();
  }
}
