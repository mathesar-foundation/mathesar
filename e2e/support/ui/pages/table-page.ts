import { type Locator, type Page, expect } from '@playwright/test';

import type { Table } from '../../api/mathesar';
import { Modal } from '../components/modal';
import { Sheet } from '../components/sheet';
import { tableUrl } from '../urls';

export type InspectorTab = 'Table' | 'View' | 'Column' | 'Record' | 'Cell';

/** The side panel of the table page. */
export class TableInspector {
  readonly root: Locator;
  /** The content of the tab that is open. */
  readonly panel: Locator;

  constructor(page: Page) {
    this.root = page.locator('.table-inspector');
    this.panel = this.root.getByRole('tabpanel');
  }

  tab(name: InspectorTab): Locator {
    return this.root.getByRole('tab', { name, exact: true });
  }

  button(name: string | RegExp): Locator {
    return this.panel.getByRole('button', { name });
  }

  link(name: string | RegExp): Locator {
    return this.panel.getByRole('link', { name });
  }

  async expectOpenTab(name: InspectorTab): Promise<void> {
    await expect(this.tab(name)).toHaveAttribute('aria-selected', 'true');
  }
}

export class TablePage {
  readonly heading: Locator;
  readonly sheet: Sheet;
  readonly inspector: TableInspector;
  readonly inspectorToggle: Locator;
  readonly newRecordButton: Locator;
  readonly recordCount: Locator;
  readonly refreshButton: Locator;
  readonly deleteRecordsModal: Modal;
  /** The record of a row, opened in a modal from the link in its primary key cell. */
  readonly recordModal: Modal;
  readonly toolbar: Locator;
  /** The refresh button, found whatever its label. It is disabled while the table loads. */
  private readonly refreshButtonOfTable: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.sheet = new Sheet(page);
    this.inspector = new TableInspector(page);
    this.inspectorToggle = page.getByRole('button', { name: 'Inspector' });
    const statusPane = page.locator('.status-pane');
    this.newRecordButton = statusPane.getByRole('button', {
      name: 'New Record',
    });
    this.recordCount = statusPane.locator('.record-count');
    this.refreshButton = statusPane.getByRole('button', { name: 'Refresh' });
    this.deleteRecordsModal = new Modal(page, /^Delete (\d+ )?Records?/);
    this.recordModal = new Modal(page, /Record in /);
    this.toolbar = page.locator('.entity-page-header');
    this.refreshButtonOfTable = page
      .locator('.status-pane.context-page .refresh-button')
      .getByRole('button');
  }

  /** A field of the record that is open in the modal. */
  recordModalField(columnName: string): Locator {
    return this.recordModal.root.getByRole('textbox', { name: columnName });
  }

  toolbarButton(
    name: 'Filter' | 'Sort' | 'Group' | 'Hide' | 'Extend',
  ): Locator {
    return this.toolbar.getByRole('button', { name });
  }

  /** The description of the table, under its name in the header. */
  headingDescription(): Locator {
    return this.toolbar.locator('.heading .description');
  }

  /** The icon before the name in the header. Its colour tells a view from a table. */
  headingIcon(): Locator {
    return this.toolbar.locator('.heading .icon');
  }

  /**
   * The icon in the header of a table without a primary key, or of a view.
   * Its text shows on hover.
   */
  noPrimaryKeyWarning(): Locator {
    return this.toolbar.getByLabel('Help');
  }

  /** The status in the header while and after the sheet saves, such as "Saving Changes". */
  saveStatus(): Locator {
    return this.toolbar.locator('.modification-status-indicator');
  }

  /**
   * Resolves when the table has loaded. A selection made while it still
   * loads is replaced by the first cell once loading ends.
   */
  async goto(table: Table): Promise<void> {
    await this.page.goto(tableUrl(table));
    await this.expectLoaded();
  }

  /**
   * Waits until the table has loaded or failed to load, in any language.
   * Call it after a reload as well, before the test selects anything.
   */
  async expectLoaded(): Promise<void> {
    await expect(this.refreshButtonOfTable).toBeEnabled();
  }
}
