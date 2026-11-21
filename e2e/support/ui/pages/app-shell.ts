import { type Locator, type Page, expect } from '@playwright/test';

/** The frame that every page of the app fills: the header and the area below it. */
export class AppShell {
  /** A page has one header. The public page of a form has none. */
  readonly headers: Locator;
  /** A compact header shows it without its label, which is also its name. */
  readonly feedbackButton: Locator;
  /** The band below the header with the name of the page, on the pages that have one. */
  readonly secondaryHeader: Locator;
  /** The area below the header. Pages nest further `main` elements in it. */
  readonly content: Locator;
  /** The spinner that stands in for a page while the page loads its data. */
  readonly loadingPage: Locator;
  /**
   * The spinning icons of the parts of the page that still load. A test waits
   * for them to go before it ends, as the database is dropped after the test.
   */
  readonly spinners: Locator;
  private readonly body: Locator;

  constructor(page: Page) {
    this.headers = page.getByRole('banner');
    this.feedbackButton = this.headers.locator('.feedback-button');
    this.secondaryHeader = page.locator('.app-secondary-header');
    this.content = page.locator('.app-layout-content');
    this.loadingPage = this.content.locator('.loading-page-container');
    this.spinners = page.locator('.fa-spin');
    this.body = page.locator('body');
  }

  /** A missing value that reaches the page as text reads "undefined" or "null". */
  async expectNoMissingValueAsText(): Promise<void> {
    // The rendered text leaves out the data that the server puts in the document.
    await expect(this.body).not.toContainText(/undefined|null/, {
      useInnerText: true,
    });
  }
}
