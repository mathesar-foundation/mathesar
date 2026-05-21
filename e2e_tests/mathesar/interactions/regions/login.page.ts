import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  get usernameInput() { return this.page.locator('input[name="username"]'); }
  get passwordInput() { return this.page.locator('input[name="password"]'); }
  get submitButton() { return this.page.locator('button[type="submit"], input[type="submit"]'); }
  get errorMessage() { return this.page.locator('.errorlist, .error'); }

  async goto() { await this.page.goto('/auth/login/'); }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
