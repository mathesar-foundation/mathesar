import type { Locator, Page } from '@playwright/test';

/**
 * The dropdown of a joined column cell that links and unlinks the records of
 * the related table. It stays open after a choice.
 */
export class MultiTagger {
  readonly root: Locator;
  /** Has the keyboard focus while the dropdown is open. */
  readonly search: Locator;
  /** One per record of the related table, in the order of their summaries. */
  readonly options: Locator;
  /** The options of the records that are linked. */
  readonly checkedOptions: Locator;
  /** The option that Enter toggles. It follows the arrow keys and the pointer. */
  readonly highlightedOption: Locator;
  readonly emptyNote: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('[data-multi-tagger]');
    this.search = this.root.getByRole('textbox');
    this.options = this.root.getByRole('button');
    this.checkedOptions = this.options.filter({
      has: page.locator('.checkbox.checked'),
    });
    this.highlightedOption = this.root.locator('button.selected');
    this.emptyNote = this.root.getByText('No records found');
  }

  option(recordSummary: string): Locator {
    return this.options.filter({
      has: this.page.getByText(recordSummary, { exact: true }),
    });
  }
}
