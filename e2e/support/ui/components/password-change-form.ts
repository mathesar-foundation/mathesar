import type { Locator, Page } from '@playwright/test';

/** The password of a user, on the edit user page and the profile page. */
export class PasswordChangeForm {
  readonly changePasswordButton: Locator;
  readonly warning: Locator;
  /** Asked only from users who change their own password. */
  readonly oldPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmation: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errors: Locator;

  constructor(page: Page) {
    const root = page.locator('.password-change-form');
    this.changePasswordButton = root.getByRole('button', {
      name: 'Change Password',
    });
    this.warning = root.locator('.warning-box');
    this.oldPassword = root.getByLabel('Old Password *');
    this.newPassword = root.getByLabel('New Password *');
    this.confirmation = root.getByLabel('Confirm Password *');
    this.saveButton = root.getByRole('button', { name: 'Save' });
    this.cancelButton = root.getByRole('button', { name: 'Cancel' });
    this.errors = root.locator('.error-box');
  }
}
