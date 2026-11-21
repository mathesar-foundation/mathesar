import type { Locator, Page } from '@playwright/test';

export class AdminSettingsPage {
  readonly heading: Locator;
  readonly usageDataCollection: Locator;
  readonly collectedDataLink: Locator;
  readonly privacyPolicyLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.usageDataCollection = page.getByRole('checkbox', {
      name: /Enable anonymous usage data collection/,
    });
    // Both links of the help text are named "here".
    const helpLinks = page
      .getByRole('main')
      .getByRole('link', { name: 'here' });
    this.collectedDataLink = helpLinks.first();
    this.privacyPolicyLink = helpLinks.last();
  }

  async goto(): Promise<void> {
    await this.page.goto('/administration/settings/');
  }
}

/** The page that shows what a usage report would contain. No page of the app links to it. */
export class SampleUsageReportPage {
  readonly report: Locator;

  constructor(private readonly page: Page) {
    this.report = page.getByRole('code');
  }

  async goto(): Promise<void> {
    await this.page.goto('/info/analytics_sample_report/');
  }
}
