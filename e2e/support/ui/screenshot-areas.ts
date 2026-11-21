import type { Locator, Page } from '@playwright/test';

/** Parts of pages that the visual tests capture on their own, which the page objects do not expose. */
export class ScreenshotAreas {
  /** The card with the form of the login page, without its decorated background. */
  readonly loginCard: Locator;
  /** The grid of the table page, without the toolbar and the inspector. */
  readonly tableSheet: Locator;
  /** The version numbers on the Software Update page. The running one changes with each release. */
  readonly releaseVersions: Locator;

  constructor(page: Page) {
    this.loginCard = page.getByRole('main');
    this.tableSheet = page.locator('.sheet');
    this.releaseVersions = page.locator('.release .version');
  }
}

/** The window in the root of a modal or of the record selector, without the veil over the page. */
export function windowOf(root: Locator): Locator {
  return root.locator('[data-window-area="window"]');
}
