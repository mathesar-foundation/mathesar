import type { Locator } from '@playwright/test';

/**
 * The input that links to one record of another table, in a record form and
 * above a column of the record selector. The cells of the sheet differ.
 */
export class LinkedRecordInput {
  /** The summary of the linked record. The input is empty without a link. */
  readonly summary: Locator;
  /** The summary, where it leads to the linked record. */
  readonly recordLink: Locator;
  readonly clearButton: Locator;
  readonly pickButton: Locator;

  constructor(readonly root: Locator) {
    this.summary = root.locator('.record-summary');
    this.recordLink = root.getByRole('link');
    this.clearButton = root.getByRole('button', { name: 'Clear value' });
    this.pickButton = root.getByRole('button', { name: 'Pick a record' });
  }
}

/** The button of a sheet cell that opens the records to link to. */
export function pickRecordButton(cell: Locator): Locator {
  return cell.getByRole('button', { name: 'Pick a record' });
}

/** The summaries in a cell of a joined column, one per linked record that fits. */
export function linkedRecordPills(cell: Locator): Locator {
  return cell.locator('.pill');
}

/** Says how many linked records a cell of a joined column leaves out, as "+3". */
export function hiddenPillCount(cell: Locator): Locator {
  return cell.locator('.remaining-count');
}

/** The number of linked records in a cell of a joined column. */
export function linkedRecordCount(cell: Locator): Locator {
  return cell.locator('.badge');
}
