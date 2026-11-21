import type { Locator, Page } from '@playwright/test';

/** The frame that every page of the app fills: the header and the area below it. */
export class AppShell {
  /** A page has one header. A visitor who is not logged in sees none. */
  readonly headers: Locator;
  /** The area below the header. Pages nest further `main` elements in it. */
  readonly content: Locator;
  /** The header and the content together, without the data that the server puts in the document. */
  readonly layout: Locator;

  constructor(page: Page) {
    this.headers = page.getByRole('banner');
    this.content = page.locator('.app-layout-content');
    this.layout = page.locator('.app-layout');
  }
}
