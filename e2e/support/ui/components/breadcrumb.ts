import { type Locator, type Page, expect } from '@playwright/test';

import { RecordSelector } from './record-selector';

type SelectorLabel =
  'Choose a Database' | 'Choose a Schema' | 'Choose a Table or Exploration';

type SectionLabel =
  | 'Databases'
  | 'Schemas'
  | 'Tables'
  | 'Tables & Views'
  | 'Explorations'
  | 'Forms';

/** A dropdown of the breadcrumb that leads to another database, schema, table, exploration or form. */
export class BreadcrumbSelector {
  readonly trigger: Locator;
  /** The dropdown. Only one selector is open at a time. */
  readonly panel: Locator;
  readonly search: Locator;
  /** The links of all sections, in reading order. */
  readonly entries: Locator;
  /** The entries for what the page shows. */
  readonly currentEntries: Locator;
  /** The parts of the entry names that match the search. */
  readonly matches: Locator;

  constructor(
    private readonly page: Page,
    label: SelectorLabel,
  ) {
    this.trigger = page
      .getByRole('banner')
      .getByRole('button', { name: label, exact: true });
    this.panel = page.locator('.breadcrumb-selector-dropdown');
    this.search = this.panel.getByRole('textbox');
    this.entries = this.panel.getByRole('link');
    this.currentEntries = this.panel
      .locator('.breadcrumb-selector-row.active')
      .getByRole('link');
    this.matches = this.panel.locator('.match');
  }

  /** A titled group of entries, with the note that counts matches or says that there are none. */
  section(label: SectionLabel): Locator {
    return this.panel.locator('.breadcrumb-selector-section').filter({
      has: this.page.getByText(label, { exact: true }),
    });
  }

  sectionEntries(label: SectionLabel): Locator {
    return this.section(label).getByRole('link');
  }

  entry(name: string): Locator {
    return this.panel.getByRole('link', { name, exact: true });
  }

  /** The button of a table entry that searches its records. It shows while the pointer is on the entry. */
  recordSearchButton(tableName: string): Locator {
    return this.panel.getByRole('button', {
      name: `Navigate to a ${tableName} record`,
    });
  }

  /** Resolves when the search field has the focus, which it gets a moment after the dropdown shows. */
  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.search).toBeFocused();
  }

  async choose(name: string): Promise<void> {
    await this.open();
    await this.entry(name).click();
  }
}

/** The window that searches the records of a table and opens the page of the chosen one. */
export class RecordSearch {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = new RecordSelector(page).root;
  }

  record(text: string): Locator {
    return this.root.getByRole('link').filter({ hasText: text });
  }
}

/** The trail in the app header: the logo, then one link per level down to the page that is open. */
export class Breadcrumb {
  /** The logo. It loses its accessible name in a narrow header. */
  readonly homeLink: Locator;
  /** The name next to the logo. A header without room for the trail hides it. */
  readonly appName: Locator;
  /** The links after the logo, one per level. */
  readonly items: Locator;
  /** The button after a table name that searches the records of the table. It has no accessible name. */
  readonly recordSearchButton: Locator;
  readonly recordSearch: RecordSearch;
  readonly databases: BreadcrumbSelector;
  readonly schemas: BreadcrumbSelector;
  readonly tablesAndExplorations: BreadcrumbSelector;

  constructor(page: Page) {
    const header = page.getByRole('banner');
    this.homeLink = header.getByRole('link').first();
    this.appName = this.homeLink.getByRole('img', { name: 'Mathesar' });
    this.items = header.locator('.breadcrumb-item').getByRole('link');
    this.recordSearchButton = header.locator('.breadcrumb > button');
    this.recordSearch = new RecordSearch(page);
    this.databases = new BreadcrumbSelector(page, 'Choose a Database');
    this.schemas = new BreadcrumbSelector(page, 'Choose a Schema');
    this.tablesAndExplorations = new BreadcrumbSelector(
      page,
      'Choose a Table or Exploration',
    );
  }

  item(name: string): Locator {
    return this.items.and(
      this.items.page().getByRole('link', { name, exact: true }),
    );
  }
}
