import fs from 'node:fs';
import path from 'node:path';

import { type JSHandle, type Locator, type Page, expect } from '@playwright/test';

import type { Schema } from '../../api/mathesar';
import { holdRequests } from '../../held-requests';
import { schemaUrl } from '../urls';

/** The page that takes a file or pasted text and creates a table from it. */
export class ImportUploadPage {
  readonly heading: Locator;
  /** The links of the app header: the logo, then the entries of the breadcrumb. */
  readonly headerLinks: Locator;
  /** "Upload a file" and "Copy and Paste Text", with their labels. */
  readonly dataSources: Locator;
  readonly uploadFileOption: Locator;
  readonly pasteTextOption: Locator;
  /** Opens the file chooser and takes dropped files. It has no role and no accessible name. */
  readonly dropZone: Locator;
  /** The file that was chosen: its name, the progress of the upload and its size. */
  readonly chosenFile: Locator;
  readonly cancelUploadButton: Locator;
  readonly pastedText: Locator;
  readonly documentationLink: Locator;
  readonly inferTypesOption: Locator;
  readonly allTextOption: Locator;
  readonly resetButton: Locator;
  readonly proceedButton: Locator;
  readonly processingHeading: Locator;
  readonly processingWarning: Locator;
  /** The messages that replace the form when the table could not be created. */
  readonly errors: Locator;
  private readonly fileInput: Locator;

  constructor(private readonly page: Page) {
    const dataSource = page.getByRole('group', { name: 'Data Source' });
    const dataTypes = page.getByRole('group', { name: 'Column Data Types' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.headerLinks = page.getByRole('banner').getByRole('link');
    this.dataSources = dataSource.getByRole('listitem');
    this.uploadFileOption = dataSource.getByRole('radio', {
      name: 'Upload a file',
    });
    this.pasteTextOption = dataSource.getByRole('radio', {
      name: 'Copy and Paste Text',
    });
    this.dropZone = dataSource
      .locator('label')
      .filter({ hasText: 'Drag a file here' });
    this.chosenFile = dataSource.locator('.file');
    this.cancelUploadButton = dataSource.getByRole('button', {
      name: 'Cancel upload',
    });
    this.pastedText = dataSource.getByLabel(
      'Paste the data you want to import',
    );
    this.documentationLink = dataSource.getByRole('link', {
      name: 'documentation',
    });
    this.inferTypesOption = dataTypes.getByRole('radio', {
      name: /^Pick the best data type for each column/,
    });
    this.allTextOption = dataTypes.getByRole('radio', {
      name: /^Use "Text" for all column data types/,
    });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.proceedButton = page.getByRole('button', { name: 'Proceed' });
    this.processingHeading = page.getByRole('heading', {
      name: 'Processing Data',
    });
    this.processingWarning = page.getByText(
      /^Large data sets can sometimes take several minutes to process\./,
    );
    this.errors = page.locator('.error-box').getByRole('listitem');
    this.fileInput = dataSource.locator('input[type="file"]');
  }

  async goto(schema: Schema): Promise<void> {
    await this.page.goto(`${schemaUrl(schema)}import/`);
  }

  /** Picks a file as the file chooser does. The upload starts at once. */
  async chooseFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Drops a file on the drop zone as a drag from the desktop does. Resolves to
   * whether the page took the drop. If it does not, the browser opens the file.
   */
  async dropFile(filePath: string): Promise<boolean> {
    const dataTransfer = await this.dataTransferWith(filePath);
    return this.dropZone.evaluate((zone, transfer) => {
      const isTaken = (type: string): boolean =>
        !zone.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: transfer,
          }),
        );
      // A browser only delivers the drop where the drag over was accepted.
      return isTaken('dragover') && isTaken('drop');
    }, dataTransfer);
  }

  async dragFileOver(filePath: string): Promise<void> {
    const dataTransfer = await this.dataTransferWith(filePath);
    await this.dropZone.dispatchEvent('dragover', { dataTransfer });
  }

  async dragFileAway(): Promise<void> {
    await this.dropZone.dispatchEvent('dragleave');
  }

  async expectDropZoneHighlighted(highlighted: boolean): Promise<void> {
    const highlight = /(^|\s)dragging-over(\s|$)/;
    await (highlighted
      ? expect(this.dropZone).toHaveClass(highlight)
      : expect(this.dropZone).not.toHaveClass(highlight));
  }

  /** Keeps uploads unfinished until the returned function is called. */
  holdUploads(): Promise<() => void> {
    return holdRequests(this.page, '**/api/db/v0/data_files/');
  }

  private dataTransferWith(filePath: string): Promise<JSHandle<DataTransfer>> {
    return this.page.evaluateHandle(
      ({ name, content }) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File([content], name));
        return transfer;
      },
      {
        name: path.basename(filePath),
        content: fs.readFileSync(filePath, 'utf8'),
      },
    );
  }
}
