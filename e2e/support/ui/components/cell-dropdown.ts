import type { Locator, Page } from '@playwright/test';

/** The list of choices that a cell of an enum column or a boolean column shown as a dropdown opens. */
export class CellDropdown {
  readonly root: Locator;
  readonly options: Locator;
  /** The option of the value that the cell holds. */
  readonly selectedOption: Locator;
  /** The option that Enter chooses. It follows the arrow keys. */
  readonly highlightedOption: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('listbox');
    this.options = this.root.getByRole('option');
    this.selectedOption = this.root.getByRole('option', { selected: true });
    this.highlightedOption = this.root.locator('.in-focus');
  }

  /** The option for NULL has no text. */
  option(label: string): Locator {
    return this.root.getByRole('option', { name: label, exact: true });
  }
}
