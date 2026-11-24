import type { Locator, Page } from '@playwright/test';

/** The page that creates the first user of a new Mathesar instance. */
export class InstallationPage {
  static readonly path = '/complete_installation/';

  readonly heading: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly passwordConfirmation: Locator;
  readonly installationReport: Locator;
  readonly usageDataCollection: Locator;
  readonly submit: Locator;
  readonly language: Locator;
  readonly form: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password', { exact: true });
    this.passwordConfirmation = page.getByLabel('Confirm Password');
    this.installationReport = page.getByLabel(/one-time confirmation/);
    this.usageDataCollection = page.getByLabel(/anonymous usage data/);
    this.submit = page.getByRole('button', { name: 'Complete Installation' });
    this.language = page.getByLabel('Display Language');
    this.form = page.locator('form.form-card');
  }

  async goto(): Promise<void> {
    await this.page.goto(InstallationPage.path);
  }

  async fillAccount(
    username: string,
    password: string,
    passwordConfirmation = password,
  ): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.passwordConfirmation.fill(passwordConfirmation);
  }
}
