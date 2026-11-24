import type { Locator } from '@playwright/test';

/**
 * A name or a description in the inspector. A click turns the text into a field
 * with Save and Cancel; the field is found after its label, which is not tied to it.
 */
export class EditableText {
  readonly input: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errors: Locator;

  constructor(container: Locator, label: string) {
    const root = container
      .getByText(label, { exact: true })
      .locator('xpath=following-sibling::*[1]');
    this.input = root.getByRole('textbox');
    this.saveButton = root.getByRole('button', { name: 'Save' });
    this.cancelButton = root.getByRole('button', { name: 'Cancel' });
    this.errors = root.locator('.error');
  }
}
