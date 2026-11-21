import { type Locator, type Page, expect } from '@playwright/test';

import { PageJumper } from './pagination';

/**
 * The accessible name of an input that is labelled with a column: the data
 * type, if the column shows one, and the column name.
 */
export function columnLabel(columnName: string): RegExp {
  return new RegExp(`(^|\\s)${columnName}$`);
}

/**
 * The window that searches the records of a table, to pick one for a linked
 * record or to open its page.
 */
export class RecordSelector {
  /** The window with all that it stacks. It covers the page while it is open. */
  readonly root: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  /** The found records, best match first. */
  readonly rows: Locator;
  /** The record that Enter submits. It follows the arrow keys and the pointer. */
  readonly highlightedRow: Locator;
  /** Says how many records match, or which of them the page shows. */
  readonly recordCount: Locator;
  readonly emptyNote: Locator;
  readonly warning: Locator;
  readonly createRecordButton: Locator;
  /** Shows the page number and opens the page jumper. */
  readonly currentPageButton: Locator;
  /** It has no accessible name. */
  readonly nextPageButton: Locator;

  constructor(
    private readonly page: Page,
    /** One level of the stack: the first window or one that a search input opened. */
    readonly window: Locator = page.locator('.root-record-selector'),
  ) {
    this.root = page.locator('.modal-record-selector');
    this.title = window.locator('[data-window-area="title"]');
    this.closeButton = window
      .locator('[data-window-area="title-bar"]')
      .getByRole('button');
    this.rows = window.locator('.tbody .tr');
    this.highlightedRow = window.locator('.tbody .tr.selected');
    const content = window.locator('.record-selector-content');
    this.recordCount = content.locator('.stats');
    this.emptyNote = content.locator('.no-results');
    this.warning = content.locator('.message-box');
    this.createRecordButton = content.getByRole('button', {
      name: 'Create Record From Search Criteria',
    });
    const pager = content.locator('.mini-pagination');
    this.currentPageButton = pager.getByRole('button', { name: /^Page \d+/ });
    this.nextPageButton = pager.getByRole('button').last();
  }

  /** The selector that a search input for a linked record opened on top of this one. */
  get nested(): RecordSelector {
    return new RecordSelector(
      this.page,
      this.page.locator('.nested-record-selector'),
    );
  }

  /** The text input above a column. The results follow it a moment after the last key. */
  searchInput(columnName: string): Locator {
    return this.window.getByRole('textbox', { name: columnLabel(columnName) });
  }

  /** The select above a boolean column. Choose from it with `chooseOption`. */
  searchSelect(columnName: string): Locator {
    return this.window.getByRole('button', { name: columnLabel(columnName) });
  }

  /** The input above a column that links to another table. It searches by a record of that table. */
  linkedRecordSearchInput(columnName: string): Locator {
    return this.window.getByRole('listbox', { name: columnName, exact: true });
  }

  row(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  /** The button in front of a record. A click anywhere on the record does the same. */
  submitButton(row: Locator): Locator {
    return row.getByRole('button', { name: 'Pick' });
  }

  /** Goes to a page through the page jumper, a dropdown outside the window. */
  async goToPage(pageNumber: number): Promise<void> {
    const jumper = new PageJumper(this.page);
    await this.currentPageButton.click();
    await jumper.typePageNumber(pageNumber);
    await jumper.goButton.click();
  }

  /** Clicks beside the window, on the veil over the page. */
  async clickOutside(): Promise<void> {
    await this.root.click({ position: { x: 5, y: 5 } });
  }

  /** Passes as well while a closed selector fades out. A new search result shows that it stayed open. */
  async expectOpen(): Promise<void> {
    await expect(this.window).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.window).toHaveCount(0);
  }
}
