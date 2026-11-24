import { type Locator, type Page, expect } from '@playwright/test';

/** The page that makes a user replace a password that an administrator set. */
export class PasswordResetPage {
  readonly explanation: Locator;
  readonly newPassword: Locator;
  readonly confirmation: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.explanation = page.getByText(
      'Since your password was set by an administrator',
    );
    this.newPassword = page.getByLabel('New Password');
    this.confirmation = page.getByLabel('Confirm');
    this.submit = page.getByRole('button', { name: 'Update Password' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/password_reset_confirm/');
  }

  async setPassword(password: string, confirmation = password): Promise<void> {
    await this.newPassword.fill(password);
    await this.confirmation.fill(confirmation);
    await this.submit.click();
  }

  async expectShown(): Promise<void> {
    await expect(this.page).toHaveURL('/auth/password_reset_confirm/');
    await expect(this.submit).toBeVisible();
  }
}
