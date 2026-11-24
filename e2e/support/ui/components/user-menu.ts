import { type Locator, type Page, expect } from '@playwright/test';

import { chooseOption } from './select';

/** The menu behind the gear button of the app header. */
export class UserMenu {
  readonly trigger: Locator;
  readonly menu: Locator;
  readonly administrationLink: Locator;
  readonly themeSelect: Locator;
  readonly logOutLink: Locator;
  /** The dots that announce a newer release of Mathesar. */
  readonly triggerUpgradeDot: Locator;
  readonly administrationUpgradeDot: Locator;

  constructor(private readonly page: Page) {
    // The gear button has no accessible name.
    this.trigger = page
      .getByRole('banner')
      .getByRole('button')
      .filter({ has: page.locator('.user-switcher') });
    this.logOutLink = page.getByRole('link', { name: 'Log Out' });
    this.menu = page.getByRole('menu').filter({ has: this.logOutLink });
    this.administrationLink = this.menu.getByRole('link', {
      name: 'Administration',
    });
    this.themeSelect = this.menu.getByRole('button');
    this.triggerUpgradeDot = this.trigger.locator('.notification-dot');
    this.administrationUpgradeDot =
      this.administrationLink.locator('.notification-dot');
  }

  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.menu).toBeVisible();
  }

  link(name: string): Locator {
    return this.menu.getByRole('link', { name, exact: true });
  }

  async chooseTheme(theme: 'Light' | 'Dark' | 'System'): Promise<void> {
    await chooseOption(this.themeSelect, theme);
  }

  async expectTheme(theme: 'light' | 'dark'): Promise<void> {
    await expect(this.page.locator('body')).toHaveClass(
      new RegExp(`\\btheme-${theme}\\b`),
    );
  }

  async logOut(): Promise<void> {
    await this.open();
    await this.logOutLink.click();
  }
}
