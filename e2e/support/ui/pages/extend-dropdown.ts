import type { Locator, Page } from '@playwright/test';

/**
 * The dropdown of "Extend" on the table page. It shows the records of a
 * table that a mapping table relates to this one, as a joined column.
 */
export class ExtendDropdown {
  /** Opens and closes the dropdown. It counts the joined columns. */
  readonly trigger: Locator;
  readonly panel: Locator;
  /** One checkbox per related table, named "<table> via <mapping table>". */
  readonly relatedTables: Locator;

  constructor(page: Page) {
    this.trigger = page
      .locator('.entity-page-header')
      .getByRole('button', { name: 'Extend' });
    this.panel = page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: 'Related tables' });
    this.relatedTables = this.panel.getByRole('checkbox');
  }

  relatedTable(name: string): Locator {
    return this.panel.getByRole('checkbox', { name });
  }
}
