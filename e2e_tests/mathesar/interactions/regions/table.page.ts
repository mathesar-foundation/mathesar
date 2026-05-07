import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { DataGrid } from '../components/data-grid';
import { ColumnInspector } from './column-inspector';

export class TablePage {
  constructor(private page: Page) {}

  get heading() { return this.page.locator('h1'); }
  get grid() { return new DataGrid(this.page.locator('.table-view')); }
  get filterButton() { return this.page.getByRole('button', { name: 'Filter' }); }
  get sortButton() { return this.page.getByRole('button', { name: 'Sort' }); }
  get groupButton() { return this.page.getByRole('button', { name: 'Group' }); }
  get inspectorButton() { return this.page.getByRole('button', { name: 'Inspector' }); }

  /** The "Column" tab panel of the inspector (visible when a column is selected). */
  get columnInspector() {
    return new ColumnInspector(
      this.page.getByRole('tabpanel', { name: 'Column', exact: true }),
    );
  }

  /**
   * Wait until the data grid has finished loading rows.
   *
   * Mathesar paints the page chrome (heading, action bar) before the grid
   * data arrives. Many downstream selectors depend on the grid being
   * populated. We use the presence of the paginator's row-count label
   * (e.g. "Showing 1–100 of 100") as the readiness signal because it only
   * renders after the first data page loads.
   */
  async waitForLoaded() {
    await expect(
      this.page.getByText(/Showing \d+[\u2013\-]\d+ of \d+/),
    ).toBeVisible();
  }
}
