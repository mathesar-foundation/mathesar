import type { Page, Locator } from '@playwright/test';

export class InstallationPage {
  readonly usernameInput: Locator;
  readonly password1Input: Locator;
  readonly password2Input: Locator;
  readonly submitButton: Locator;
  readonly heading: Locator;

  constructor(private page: Page) {
    this.usernameInput = page.locator('input[name="username"]');
    this.password1Input = page.locator('input[name="password1"]');
    this.password2Input = page.locator('input[name="password2"]');
    this.submitButton = page.locator('button[type="submit"], input[type="submit"]');
    this.heading = page.locator('h1');
  }

  async goto() {
    await this.page.goto('/complete_installation/');
  }

  async fillForm(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.password1Input.fill(password);
    await this.password2Input.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async completeInstallation(username: string, password: string) {
    await this.fillForm(username, password);
    await this.submit();
  }
}
