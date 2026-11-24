import type { Locator, Page } from '@playwright/test';

import { menuItem } from '../components/menu';
import { Modal } from '../components/modal';
import { moreActionsButton } from '../components/more-actions';
import { tooltip } from '../components/tooltip';

type CardAction =
  'Edit Connection' | 'Reinstall Mathesar Schemas' | 'Disconnect Database';

/** The page at `/` with the list of connected databases. */
export class HomePage {
  readonly welcome: Locator;
  readonly help: Locator;
  readonly tooltip: Locator;
  readonly tooltipLink: Locator;
  readonly search: Locator;
  readonly searchSummary: Locator;
  readonly clearSearchButton: Locator;
  readonly connectDatabaseButton: Locator;
  readonly cards: Locator;
  readonly emptyState: Locator;
  /** The box above the list that says which databases need an upgrade. */
  readonly upgradeNotice: Locator;
  readonly bulkUpgradeButton: Locator;
  readonly bulkUpgradeModal: Modal;
  readonly bulkUpgradeErrorsModal: Modal;
  readonly resourceLinks: Locator;

  constructor(private readonly page: Page) {
    const main = page.getByRole('main');
    this.welcome = page.getByText(/^Welcome to Mathesar, /);
    this.help = main
      .getByRole('heading', { name: 'Databases' })
      .getByLabel('Help');
    this.tooltip = tooltip(page);
    this.tooltipLink = this.tooltip.getByRole('link');
    this.search = main.getByPlaceholder('Search Databases');
    this.searchSummary = main.getByText(/databases? match/);
    this.clearSearchButton = main.getByRole('button', { name: 'Clear' });
    this.connectDatabaseButton = main.getByRole('button', {
      name: 'Connect Database',
    });
    this.cards = main.locator('.db-card');
    this.emptyState = main.locator('[data-identifier="connection-empty-text"]');
    this.upgradeNotice = main.locator('.warning-box');
    this.bulkUpgradeButton = this.upgradeNotice.getByRole('button');
    this.bulkUpgradeModal = new Modal(page, 'Upgrade Multiple Databases');
    this.bulkUpgradeErrorsModal = new Modal(
      page,
      'Some Errors Were Encountered',
    );
    this.resourceLinks = main.locator('.resources-sidebar').getByRole('link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** A card shows the name of its database, next to the nickname if it has one. */
  card(databaseName: string): Locator {
    return this.cards.filter({ hasText: databaseName });
  }

  /** The link that covers the card. A database that needs an upgrade has none. */
  cardLink(databaseName: string): Locator {
    return this.card(databaseName).getByRole('link');
  }

  upgradeButton(databaseName: string): Locator {
    return this.card(databaseName).getByRole('button', { name: 'Upgrade' });
  }

  cardMenuButton(databaseName: string): Locator {
    return moreActionsButton(this.card(databaseName));
  }

  async chooseCardAction(
    databaseName: string,
    action: CardAction,
  ): Promise<void> {
    await this.cardMenuButton(databaseName).click();
    await menuItem(this.page, action).click();
  }
}
