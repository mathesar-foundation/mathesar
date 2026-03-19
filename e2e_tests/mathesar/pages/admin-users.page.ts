import type { Page, Locator } from '@playwright/test';

export class AdminUsersPage {
  private page: Page;
  readonly heading: Locator;
  readonly addUserLink: Locator;
  readonly searchUsersInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /Users/ });
    this.addUserLink = page.getByRole('link', { name: 'Add User' });
    this.searchUsersInput = page.getByRole('textbox', {
      name: 'Search Users',
    });
  }

  async goto() {
    await this.page.goto('/administration/users/');
  }

  userLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}

export class AddUserPage {
  private page: Page;
  readonly heading: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'New User' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.displayNameInput = page.getByRole('textbox', {
      name: 'Display Name',
    });
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/administration/users/new/');
  }

  async fillAndSubmit(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.saveButton.click();
  }
}
