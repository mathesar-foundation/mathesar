import type { Page } from '@playwright/test';
import { DataGrid } from '../regions/data-grid';

export class TableView {
  constructor(private page: Page) {}

  get heading() { return this.page.locator('h1'); }
  get grid() { return new DataGrid(this.page.locator('[data-sheet-element="sheet"]')); }
  get filterButton() { return this.page.getByRole('button', { name: 'Filter' }); }
  get sortButton() { return this.page.getByRole('button', { name: 'Sort' }); }
  get groupButton() { return this.page.getByRole('button', { name: 'Group' }); }
}
