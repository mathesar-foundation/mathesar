import type { Locator, Page } from '@playwright/test';

import { PasswordChangeForm } from '../components/password-change-form';
import { UserDetailsForm } from '../components/user-details-form';

/** The page where users manage their own account. */
export class ProfilePage {
  readonly heading: Locator;
  readonly details: UserDetailsForm;
  readonly password: PasswordChangeForm;
  readonly deleteAccountHeading: Locator;
  readonly deleteAccountHint: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.details = new UserDetailsForm(page);
    this.password = new PasswordChangeForm(page);
    this.deleteAccountHeading = page.getByRole('heading', {
      name: 'Delete Account',
    });
    this.deleteAccountHint = page.getByText(
      'Please contact your administrator to request permanent deletion of your account.',
    );
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile/');
  }
}
