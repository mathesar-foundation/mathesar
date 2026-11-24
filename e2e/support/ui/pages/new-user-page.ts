import type { Locator, Page } from '@playwright/test';

import { UserDetailsForm } from '../components/user-details-form';

export class NewUserPage {
  readonly heading: Locator;
  readonly form: UserDetailsForm;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'New User' });
    this.form = new UserDetailsForm(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/users/new/');
  }
}
