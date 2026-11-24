import type { Locator } from '@playwright/test';

/**
 * A select that holds several values. Its list of options stays open after a
 * choice and renders outside the trigger.
 */
export class MultiSelect {
  readonly values: Locator;
  readonly clearButton: Locator;

  constructor(readonly trigger: Locator) {
    this.values = trigger.locator('.selected-value');
    this.clearButton = trigger.locator('.clear-button');
  }

  /** Opens the list, toggles each option and closes the list. */
  async toggle(...options: string[]): Promise<void> {
    const page = this.trigger.page();
    await this.trigger.click();
    const id = await this.trigger.getAttribute('id');
    const listbox = page.locator(`[id="${id}-select-options"]`);
    for (const option of options) {
      await listbox
        .getByRole('option')
        .filter({ has: page.getByText(option, { exact: true }) })
        .click();
    }
    await this.trigger.click();
  }

  removeButton(value: string): Locator {
    return this.values
      .filter({ has: this.trigger.page().getByText(value, { exact: true }) })
      .locator('.remove-button');
  }
}
