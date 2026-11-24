import type { Locator, Page } from '@playwright/test';

import { chooseOption } from './select';
import { tooltip } from './tooltip';

export type DisplayLanguage =
  'English (en)' | 'Spanish (es)' | 'French (fr)' | 'Japanese (ja)';

/** The details of a user, on the new user page, the edit user page and the profile page. */
export class UserDetailsForm {
  readonly displayName: Locator;
  readonly email: Locator;
  readonly username: Locator;
  /** Only a new user has a password in this form. */
  readonly password: Locator;
  readonly displayLanguage: Locator;
  readonly admin: Locator;
  readonly adminHelp: Locator;
  readonly adminHelpTooltip: Locator;
  readonly saveButton: Locator;
  readonly discardButton: Locator;
  /** Messages under the fields and under the buttons. */
  readonly errors: Locator;

  constructor(page: Page) {
    // The form has no element of its own. Its box is the one with the display name.
    const root = page
      .locator('.form-box, .inset-page-section')
      .filter({ has: page.getByLabel('Display Name') });
    this.displayName = root.getByLabel('Display Name');
    this.email = root.getByLabel('Email');
    this.username = root.getByLabel('Username *');
    this.password = root.getByLabel('Password *');
    this.displayLanguage = root.getByLabel('Display Language *');
    this.admin = root.getByLabel('Admin', { exact: true });
    this.adminHelp = root.getByLabel('Help');
    this.adminHelpTooltip = tooltip(page);
    this.saveButton = root.getByRole('button', { name: 'Save' });
    this.discardButton = root.getByRole('button', { name: 'Discard Changes' });
    this.errors = root.locator('.error-box');
  }

  async chooseDisplayLanguage(language: DisplayLanguage): Promise<void> {
    await chooseOption(this.displayLanguage, language);
  }
}
