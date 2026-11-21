import type { Locator, Page } from '@playwright/test';

import { chooseColumn } from '../components/column-options';
import { Modal } from '../components/modal';
import { openSelect } from '../components/select';

/** The modal of the table page that imports the rows of a CSV file into the table. */
export class TableImportModal extends Modal {
  /** Opens the file chooser. Shown until a file is chosen. */
  readonly dropZone: Locator;
  /** The name and the size of the chosen file. */
  readonly file: Locator;
  readonly removeFileButton: Locator;
  /** A custom select of "Column Names" and "Data to be Imported". */
  readonly firstRow: Locator;
  readonly mapping: Locator;
  /** Replaces the mapping when the file cannot be read. */
  readonly parseError: Locator;
  /** The columns of the file, one per row of the mapping. */
  readonly csvColumns: Locator;
  readonly sampleValues: Locator;
  /** Custom selects that name the type and the name of the table column, or "None". */
  readonly destinations: Locator;
  readonly importButton: Locator;
  /** The message under the Import button when the import failed. */
  readonly error: Locator;
  private readonly fileInput: Locator;

  constructor(page: Page) {
    super(page, 'Import');
    this.dropZone = this.body
      .locator('label')
      .filter({ hasText: 'Drag a file here' });
    this.file = this.body.getByRole('group', { name: 'File' });
    this.removeFileButton = this.file.getByRole('button');
    this.firstRow = this.body.getByRole('button', {
      name: 'Content of First Row',
    });
    this.mapping = this.body.getByRole('group', { name: 'Column Mapping' });
    this.parseError = this.body.locator('.error-box');
    this.csvColumns = this.mapping.locator('.column-name');
    this.sampleValues = this.mapping.locator('.sample-value');
    this.destinations = this.mapping
      .locator('.destination')
      .getByRole('button');
    this.importButton = this.footer.getByRole('button', { name: 'Import' });
    this.error = this.footer.getByRole('paragraph');
    this.fileInput = this.body.locator('input[type="file"]');
  }

  async chooseFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  /** Maps the file column at this position to a table column, or to "None". */
  async mapColumn(position: number, destination: string): Promise<void> {
    await chooseColumn(this.destinations.nth(position), destination);
  }

  /** Opens the destinations of the file column at this position and returns them. */
  async destinationOptions(position: number): Promise<Locator> {
    const listbox = await openSelect(this.destinations.nth(position));
    return listbox.getByRole('option');
  }
}
