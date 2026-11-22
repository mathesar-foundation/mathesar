import type { Locator, Page } from '@playwright/test';

import { Modal } from '../components/modal';
import { PasswordChangeForm } from '../components/password-change-form';
import { UserDetailsForm } from '../components/user-details-form';

/** The page of one user in the administration. */
export class EditUserPage {
  static readonly urlPattern = /\/administration\/users\/\d+\/$/;

  readonly heading: Locator;
  readonly details: UserDetailsForm;
  readonly password: PasswordChangeForm;
  readonly deleteButton: Locator;
  readonly deleteModal: Modal;
  readonly notFoundMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^Edit User:/ });
    this.details = new UserDetailsForm(page);
    this.password = new PasswordChangeForm(page);
    this.deleteButton = page
      .getByRole('main')
      .getByRole('button', { name: 'Delete User' });
    this.deleteModal = new Modal(page, /^Delete User/);
    this.notFoundMessage = page.getByText('User not found');
  }

  async goto(user: { id: number }): Promise<void> {
    await this.page.goto(`/administration/users/${user.id}/`);
  }

  /** The last entry of the breadcrumb in the app header. */
  breadcrumb(username: string): Locator {
    return this.page
      .getByRole('banner')
      .getByRole('link', { name: username, exact: true });
  }
}
