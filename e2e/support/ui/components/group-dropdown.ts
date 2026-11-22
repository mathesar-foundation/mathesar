import type { Locator, Page } from '@playwright/test';

import type { TablePage } from '../pages/table-page';
import { columnMenuItem } from './column-options';

/** One grouping column of the Group dropdown. */
export class GroupEntry {
  readonly column: Locator;
  /** How the values are turned into groups. Only some data types offer a choice. */
  readonly preprocessing: Locator;
  readonly removeButton: Locator;

  constructor(readonly root: Locator) {
    const selects = root.locator('[aria-haspopup="listbox"]');
    this.column = selects.nth(0);
    this.preprocessing = selects.nth(1);
    this.removeButton = root.getByRole('button').last();
  }
}

/** The Group dropdown of the table page: a menu of columns at first, then the list of groupings. */
export class GroupDropdown {
  readonly trigger: Locator;
  /** The list of groupings. Not there while the dropdown shows the menu of columns. */
  readonly panel: Locator;
  readonly entries: Locator;
  readonly addButton: Locator;
  private readonly page: Page;

  constructor(tablePage: TablePage) {
    this.page = tablePage.page;
    this.trigger = tablePage.toolbarButton('Group');
    this.panel = this.page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: 'Group records by' });
    this.entries = this.panel.locator('.input-group');
    this.addButton = this.panel.getByRole('button', {
      name: 'Add New Grouping',
    });
  }

  entry(index: number): GroupEntry {
    return new GroupEntry(this.entries.nth(index));
  }

  /** Opens the dropdown of a table without grouping and picks a column from its menu. */
  async addFirstEntry(columnName: string): Promise<void> {
    await this.trigger.click();
    await columnMenuItem(this.page, columnName).click();
  }

  async addEntry(columnName: string): Promise<void> {
    await this.addButton.click();
    await columnMenuItem(this.page, columnName).click();
  }
}
