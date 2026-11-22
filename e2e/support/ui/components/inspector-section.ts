import type { Locator } from '@playwright/test';

/**
 * A section of an inspector panel, found by its title. A click on the header shows or
 * hides it; sections that save changes show Save and Cancel once something changed.
 */
export class InspectorSection {
  readonly root: Locator;
  readonly header: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(panel: Locator, title: string | RegExp) {
    const headerClass = '.collapsible-header-btn';
    this.root = panel.locator('.inspector-section').filter({
      has: panel.page().locator(headerClass, { hasText: title }),
    });
    this.header = this.root.locator(headerClass);
    this.saveButton = this.root.getByRole('button', { name: 'Save' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }
}
