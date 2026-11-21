import type { Locator, Page } from '@playwright/test';

import type { TablePage } from '../pages/table-page';
import { fillFormattedInput } from './formatted-input';

/** The dropdown of the page button, which goes to a page by its number. */
export class PageJumper {
  readonly root: Locator;
  readonly pageInput: Locator;
  readonly goButton: Locator;
  readonly totalPages: Locator;
  readonly firstPageButton: Locator;
  readonly lastPageButton: Locator;
  /** Only here while the status bar is too narrow to show the page size beside it. */
  readonly pageSize: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: 'Go To Page' });
    this.pageInput = this.root.getByLabel('Go To Page');
    this.goButton = this.root.getByRole('button', { name: 'Go' });
    this.totalPages = this.root.getByText(/^Total Pages:/);
    // Neither button has a label. They are the first and the last of the dropdown.
    const outerButtons = this.root.locator('.page-jumper > span');
    this.firstPageButton = outerButtons.first().getByRole('button');
    this.lastPageButton = outerButtons.last().getByRole('button');
    this.pageSize = this.root.getByRole('button', { name: 'Page Size' });
  }

  async typePageNumber(pageNumber: number): Promise<void> {
    await fillFormattedInput(this.pageInput, String(pageNumber));
  }
}

/** The paging controls in the status bar of the table page. */
export class Pagination {
  /** Names the page, as in "Page 2 of 3", and opens the page jumper. */
  readonly currentPage: Locator;
  /** Only there when a page comes before the current one. */
  readonly previousButton: Locator;
  /** Only there when a page comes after the current one. */
  readonly nextButton: Locator;
  readonly pageSize: Locator;
  readonly jumper: PageJumper;

  constructor(tablePage: TablePage) {
    const { page } = tablePage;
    this.currentPage = page
      .locator('.mini-pagination')
      .getByRole('button', { name: /^Page \d/ });
    // Neither button has a label. They sit before and after the page button.
    this.previousButton = this.currentPage.locator(
      'xpath=preceding-sibling::button',
    );
    this.nextButton = this.currentPage.locator(
      'xpath=following-sibling::button',
    );
    this.pageSize = page.locator('.page-size-dropdown').getByRole('button');
    this.jumper = new PageJumper(page);
  }
}
