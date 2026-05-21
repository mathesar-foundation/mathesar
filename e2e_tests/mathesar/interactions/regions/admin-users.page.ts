import type { Page } from '@playwright/test';

export class AdminUsersPage {
  constructor(private page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: /Users/ }); }
  get addUserLink() { return this.page.getByRole('link', { name: 'Add User' }); }
  get searchUsersInput() { return this.page.getByRole('textbox', { name: 'Search Users' }); }

  async goto() { await this.page.goto('/administration/users/'); }

  userLink(name: string) {
    return this.page.getByRole('link', { name });
  }
}

export class AddUserPage {
  constructor(private page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: 'New User' }); }
  get usernameInput() { return this.page.getByRole('textbox', { name: 'Username' }); }
  get passwordInput() { return this.page.getByRole('textbox', { name: 'Password' }); }
  get displayNameInput() { return this.page.getByRole('textbox', { name: 'Display Name' }); }
  get emailInput() { return this.page.getByRole('textbox', { name: 'Email' }); }
  get saveButton() { return this.page.getByRole('button', { name: 'Save' }); }

  async goto() { await this.page.goto('/administration/users/new/'); }

  async fillAndSubmit(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.saveButton.click();
  }
}
