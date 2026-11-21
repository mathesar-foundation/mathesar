import type { Locator, Page } from '@playwright/test';

/** The dropdown of a foreign key input that searches the records to choose from. */
export class RowSeeker {
  readonly root: Locator;
  /** Has the keyboard focus while the dropdown is open. */
  readonly search: Locator;
  readonly options: Locator;
  readonly emptyMessage: Locator;
  /** Shows only where the input may create a record. */
  readonly addNewRecordButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('[data-row-seeker]');
    this.search = this.root.locator('[data-row-seeker-search-box]');
    this.options = this.root.getByRole('option');
    this.emptyMessage = this.root.getByText('No records found');
    this.addNewRecordButton = this.root.getByRole('button', {
      name: 'Add New Record',
    });
  }

  option(recordSummary: string): Locator {
    return this.options.filter({ hasText: recordSummary });
  }

  /** Names the page of records, as "Page 2". Only there while the records fill more than one page of 200. */
  get currentPage(): Locator {
    return this.root
      .locator('.mini-pagination')
      .getByRole('button', { name: /^Page \d/ });
  }

  /** Only there while a page follows the current one. It has no name. */
  get nextPageButton(): Locator {
    return this.currentPage.locator('xpath=following-sibling::button');
  }

  /** How far the dropdown is from the bottom left corner of the input that opened it. */
  async offsetFrom(input: Locator): Promise<{ x: number; y: number }> {
    const dropdown = await this.root.boundingBox();
    const anchor = await input.boundingBox();
    if (!dropdown || !anchor) throw new Error('The dropdown is not visible');
    return {
      x: dropdown.x - anchor.x,
      y: dropdown.y - anchor.y - anchor.height,
    };
  }
}
