import type { Locator, Page } from '@playwright/test';

import type { Table } from '../../api/mathesar';
import { LinkedRecordInput } from '../components/linked-record';
import { Modal } from '../components/modal';
import { columnLabel } from '../components/record-selector';
import { Sheet } from '../components/sheet';
import { recordUrl } from '../urls';

/** The records of another table that link to the record on show, as a small sheet. */
export class RelatedRecords {
  readonly heading: Locator;
  /** The table name in the heading. It is plain text inside a modal. */
  readonly tableLink: Locator;
  readonly help: Locator;
  /** Opens the sort dropdown of these records only. It counts their sort columns. */
  readonly sortButton: Locator;
  readonly sheet: Sheet;
  readonly recordCount: Locator;
  /** Reads "Loading" instead until the records have loaded, which they do twice on arrival. */
  readonly refreshButton: Locator;

  constructor(
    page: Page,
    readonly root: Locator,
  ) {
    this.heading = root.getByRole('heading');
    this.tableLink = this.heading.getByRole('link');
    this.help = this.heading.getByLabel('Help');
    this.sortButton = root.getByRole('button', { name: /^Sort/ });
    this.sheet = new Sheet(page, root.locator('.sheet'));
    this.recordCount = root.locator('.record-count');
    this.refreshButton = root.getByRole('button', { name: 'Refresh' });
  }
}

/**
 * One record as a form with a field per column, followed by the records that
 * link to it. The record page and the record modal both show it.
 */
export class RecordView {
  /** The column names, in the order of the fields. */
  readonly fieldLabels: Locator;
  /** Appears with the first change, next to "Discard Changes". */
  readonly saveButton: Locator;
  readonly discardButton: Locator;
  /** Says whether there are unsaved changes and how the last save went. */
  readonly status: Locator;
  /** What the database answered to a save that it refused. */
  readonly errors: Locator;
  readonly relatedRecordHeadings: Locator;

  constructor(
    protected readonly page: Page,
    readonly root: Locator,
  ) {
    this.fieldLabels = root.locator('.direct-field label');
    this.saveButton = root.getByRole('button', { name: 'Save', exact: true });
    this.discardButton = root.getByRole('button', { name: 'Discard Changes' });
    this.status = root.locator('.modification-status-indicator');
    this.errors = root.locator('.form-submit > .errors');
    this.relatedRecordHeadings = root
      .locator('.table-widget')
      .getByRole('heading');
  }

  /** The text input of a column. Linked record and boolean columns have other controls. */
  field(columnName: string): Locator {
    return this.fields().getByRole('textbox', {
      name: columnLabel(columnName),
    });
  }

  /** The select of a boolean column. Choose from it with `chooseOption`. */
  select(columnName: string): Locator {
    return this.fields().getByRole('button', {
      name: columnLabel(columnName),
    });
  }

  linkedRecord(columnName: string): LinkedRecordInput {
    return new LinkedRecordInput(
      this.fields().getByRole('listbox', { name: columnName, exact: true }),
    );
  }

  /** Opens the menu of a field: "Set to NULL" and, for a linked record, the ways to open it. */
  fieldOptionsButton(columnName: string): Locator {
    return this.fields().getByRole('button', {
      name: `${columnName} Field Options`,
      exact: true,
    });
  }

  /** The mark that tells a NULL from an empty text. Date and time fields never show it. */
  nullMark(columnName: string): Locator {
    return this.fieldRow(columnName).locator('.null');
  }

  descriptionIcon(columnName: string): Locator {
    return this.fieldRow(columnName).getByLabel('Column Description');
  }

  relatedRecords(tableName: string): RelatedRecords {
    return new RelatedRecords(
      this.page,
      this.root.locator('.table-widget').filter({
        has: this.page.getByRole('heading', { name: tableName }),
      }),
    );
  }

  private fields(): Locator {
    return this.root.locator('.fields');
  }

  private fieldRow(columnName: string): Locator {
    return this.root.locator('.direct-field').filter({
      has: this.page.getByRole('button', {
        name: `${columnName} Field Options`,
        exact: true,
      }),
    });
  }
}

export class RecordPage extends RecordView {
  /** The summary of the record, as the title of the page. */
  readonly summary: Locator;
  /** Leads back to the table of the record. */
  readonly tableLink: Locator;
  readonly deleteButton: Locator;
  readonly deleteModal: Modal;
  /** Shows while the record or the tables that link to it load. */
  readonly loadingSpinner: Locator;
  /** Replaces the page for a record that does not exist. */
  readonly errorHeading: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, page.getByRole('main'));
    const header = page.locator('.record-page-header');
    this.summary = header.locator('.entity-name');
    this.tableLink = header.getByRole('link');
    this.deleteButton = header.getByRole('button', { name: 'Delete Record' });
    this.deleteModal = new Modal(page, 'Delete Record?');
    this.loadingSpinner = page.locator('.record-page-loading-spinner');
    this.errorHeading = page.getByRole('heading', { name: 'Error' });
    this.errorMessage = page.getByRole('main').getByRole('paragraph');
  }

  async goto(table: Table, primaryKey: number): Promise<void> {
    await this.page.goto(recordUrl(table, primaryKey));
  }
}

/** A record in a modal over the page that it was opened from. */
export class RecordModal extends Modal {
  readonly view: RecordView;
  /** The link in the title that opens the record page. It has no accessible name. */
  readonly fullPageLink: Locator;
  readonly closeButton: Locator;

  /** Without a summary, it stands for the only record modal that is open. */
  constructor(page: Page, summary: string | RegExp = /Record in /) {
    super(page, summary);
    this.view = new RecordView(page, this.root);
    this.fullPageLink = this.title.getByRole('link');
    this.closeButton = this.root
      .locator('[data-window-area="title-bar"]')
      .getByRole('button');
  }

  /** Clicks beside the window, where the modal covers the page. */
  async clickBeside(): Promise<void> {
    await this.root.click({ position: { x: 5, y: 5 } });
  }
}
