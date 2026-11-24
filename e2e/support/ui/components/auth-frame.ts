import type { Locator, Page } from '@playwright/test';

/** What the login page and the password page share. The server renders both. */
export class AuthFrame {
  readonly heading: Locator;
  readonly languageSelect: Locator;
  readonly languageOptions: Locator;
  /** The box above the submit button that reports a rejected login. */
  readonly errorMessage: Locator;
  /** The reasons the server gives under a field that it rejected. */
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.languageSelect = page.getByLabel('Display Language');
    this.languageOptions = this.languageSelect.getByRole('option');
    this.errorMessage = page.locator('.error-message');
    this.fieldErrors = page.locator('.help.error');
  }
}
