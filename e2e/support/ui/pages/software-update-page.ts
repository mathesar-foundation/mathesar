import type { Locator, Page } from '@playwright/test';

type ReleaseBoxTitle =
  | 'You are running the latest version'
  | 'New Version Available'
  | 'Currently Installed'
  | 'Latest Available Version (not installed)';

/** One release on the Software Update page. */
export class ReleaseBox {
  readonly notesLink: Locator;

  constructor(readonly root: Locator) {
    this.notesLink = root.getByRole('link');
  }
}

export class SoftwareUpdatePage {
  readonly heading: Locator;
  readonly releaseBoxes: Locator;
  readonly error: Locator;
  readonly checkForUpdatesButton: Locator;
  readonly lastChecked: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Software Update' });
    this.releaseBoxes = page.locator('.release');
    this.error = page.getByRole('main').locator('.error-box');
    this.checkForUpdatesButton = page.getByRole('button', {
      name: 'Check for Updates',
    });
    this.lastChecked = page.getByText(/Last checked: \d/);
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/update/');
  }

  releaseBox(title: ReleaseBoxTitle): ReleaseBox {
    return new ReleaseBox(this.releaseBoxes.filter({ hasText: title }));
  }
}
