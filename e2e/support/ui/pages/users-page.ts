import type { Locator, Page } from '@playwright/test';

/** The list of users in the administration. */
export class UsersPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly searchSummary: Locator;
  readonly clearSearchButton: Locator;
  readonly addUserLink: Locator;
  /** Each row is one link that holds the username, the details and the role. */
  readonly rows: Locator;
  readonly emptyState: Locator;
  /** Takes the place of the list while the users load. */
  readonly loadingSkeleton: Locator;
  /** Takes the place of the list when the users could not be loaded. */
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 2 });
    this.search = page.getByPlaceholder('Search Users');
    this.searchSummary = page.getByText(/users? match/);
    this.clearSearchButton = page.getByRole('button', { name: 'Clear' });
    this.addUserLink = page.getByRole('link', { name: 'Add User' });
    this.rows = page.locator('.users-list').getByRole('link');
    this.emptyState = page.getByText('No users found');
    this.loadingSkeleton = page.locator('.user-skeleton-container');
    this.error = page.getByRole('main').locator('.error-box');
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/users/');
  }

  row(username: string): Locator {
    return this.rows.and(this.page.getByLabel(username, { exact: true }));
  }
}
