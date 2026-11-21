import { type Locator, type Page, expect } from '@playwright/test';

import type { Credentials } from '../../api/rpc';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Log In' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login/');
  }

  async logIn({ username, password }: Credentials): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectShown(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login\//);
    await expect(this.submit).toBeVisible();
  }
}
