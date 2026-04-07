import type { Page } from '@playwright/test';

export class InstallationView {
  constructor(private page: Page) {}

  get usernameInput() { return this.page.locator('input[name="username"]'); }
  get password1Input() { return this.page.locator('input[name="password1"]'); }
  get password2Input() { return this.page.locator('input[name="password2"]'); }
  get submitButton() { return this.page.locator('button[type="submit"], input[type="submit"]'); }
  get heading() { return this.page.locator('h1'); }

  async goto() { await this.page.goto('/complete_installation/'); }

  async completeInstallation(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.password1Input.fill(password);
    await this.password2Input.fill(password);
    await this.submitButton.click();
  }
}
