import type { Locator, Page } from '@playwright/test';

import { menuItem } from '../components/menu';
import { moreActionsButton } from '../components/more-actions';
import { tooltip } from '../components/tooltip';

type DatabaseAction =
  'Disconnect Database' | 'Edit Connection' | 'Reinstall Mathesar Schemas';

/** What the sections of the database page share: the header and the tabs. */
export class DatabaseLayout {
  readonly header: Locator;
  /** The name of the database and the server it is on, as PostgreSQL knows them. */
  readonly connection: Locator;
  readonly permissionsButton: Locator;
  readonly menuButton: Locator;
  readonly schemasTab: Locator;
  readonly settingsTab: Locator;
  readonly schemasPanel: Locator;
  readonly settingsPanel: Locator;
  readonly schemasHelp: Locator;
  readonly tooltip: Locator;
  readonly tooltipLink: Locator;
  /** What replaces the page at the URL of a database that is not connected. */
  readonly notFoundMessage: Locator;
  /** The logo of the app header. It opens the home page without loading the app again. */
  readonly homeLink: Locator;

  constructor(private readonly page: Page) {
    this.header = page.locator('.database-page-header');
    this.connection = this.header.locator('code');
    this.permissionsButton = this.header.getByRole('button', {
      name: 'Database Permissions',
    });
    this.menuButton = moreActionsButton(this.header);
    this.schemasTab = page.getByRole('tab', { name: /^Schemas/ });
    this.settingsTab = page.getByRole('tab', { name: 'Database Settings' });
    this.schemasPanel = page.getByRole('tabpanel', { name: /^Schemas/ });
    this.settingsPanel = page.getByRole('tabpanel', {
      name: 'Database Settings',
    });
    this.schemasHelp = this.schemasTab.getByLabel('Help');
    this.tooltip = tooltip(page);
    this.tooltipLink = this.tooltip.getByRole('link');
    this.notFoundMessage = page.getByText(
      /^Database with id \d+ is not found\.$/,
    );
    this.homeLink = page
      .getByRole('banner')
      .getByRole('link', { name: 'Mathesar' });
  }

  async chooseAction(action: DatabaseAction): Promise<void> {
    await this.menuButton.click();
    await menuItem(this.page, action).click();
  }
}
