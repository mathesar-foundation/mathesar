import type { Locator, Page } from '@playwright/test';

import type { TablePage } from '../pages/table-page';

/** The Hide dropdown of the table page: one checkbox per column, checked for a hidden column. */
export class HideDropdown {
  readonly trigger: Locator;
  readonly panel: Locator;
  /** In the order of the columns of the table. */
  readonly checkboxes: Locator;
  readonly hideAllButton: Locator;
  readonly showAllButton: Locator;
  private readonly page: Page;

  constructor(tablePage: TablePage) {
    this.page = tablePage.page;
    this.trigger = tablePage.toolbarButton('Hide');
    this.hideAllButton = this.page.getByRole('button', { name: 'Hide all' });
    this.showAllButton = this.page.getByRole('button', { name: 'Show all' });
    this.panel = this.page
      .locator('[data-attachable-dropdown]')
      .filter({ has: this.hideAllButton });
    this.checkboxes = this.panel.getByRole('checkbox');
  }

  /** The accessible name of a checkbox starts with the data type, so the column name is matched as text. */
  checkbox(columnName: string): Locator {
    return this.panel
      .locator('.labeled-input')
      .filter({ has: this.page.getByText(columnName, { exact: true }) })
      .getByRole('checkbox');
  }
}
