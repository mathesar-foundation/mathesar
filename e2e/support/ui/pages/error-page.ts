import type { Locator, Page } from '@playwright/test';

/** What the app shows at a URL that it has no page for. */
export class ErrorPage {
  readonly heading: Locator;
  readonly message: Locator;
  readonly homeLink: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Error' });
    this.message = page.getByText("The page you're looking for doesn't exist.");
    this.homeLink = page.getByRole('link', { name: 'Go to homepage' });
  }
}
