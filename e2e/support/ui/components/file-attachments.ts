import { readFile } from 'node:fs/promises';

import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';
import { columnLabel } from './record-selector';

/** A file that a test makes in memory, in the form that Playwright uploads. */
export interface FilePayload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export interface DownloadedFile {
  /** The name that the browser saves the file under. */
  name: string;
  content: Buffer;
}

/** Clicks a link that downloads a file, and reads the file. */
export async function downloadFrom(link: Locator): Promise<DownloadedFile> {
  const download = link.page().waitForEvent('download');
  await link.click();
  const file = await download;
  return {
    name: file.suggestedFilename(),
    content: await readFile(await file.path()),
  };
}

/**
 * A sheet cell, record field or form field of a File column: an image shows as a
 * thumbnail, any other file as a button with an icon, both named by the file's URI.
 */
export class FileField {
  /** Opens the Upload File window. A sheet cell shows it only while it is active. It has no name. */
  readonly uploadButton: Locator;
  readonly thumbnail: Locator;
  /** The button of a file that is not an image. */
  readonly fileButton: Locator;
  /** Covers the thumbnail while the full image loads. */
  readonly loadingIndicator: Locator;

  constructor(readonly root: Locator) {
    this.uploadButton = root.getByRole('button', { name: '', exact: true });
    this.thumbnail = root.getByRole('img');
    this.fileButton = root.getByRole('button', { name: /\S/ });
    this.loadingIndicator = root.locator('.content-loading-indicator.loading');
  }
}

/** The input of a File column in a record or a form, found by the label of its field. */
export function fileInput(container: Locator, label: string): FileField {
  return new FileField(
    container.getByRole('listbox', { name: columnLabel(label) }),
  );
}

/** The name, the storage URI and the MIME type of a file, a row each. */
export class FileDetails {
  /** The names of the rows. A visitor of a public form gets no storage URI. */
  readonly labels: Locator;
  readonly name: Locator;
  readonly storageUri: Locator;
  readonly mimeType: Locator;

  constructor(private readonly root: Locator) {
    this.labels = root.getByRole('rowheader');
    this.name = this.value('Name');
    this.storageUri = this.value('Storage URI');
    this.mimeType = this.value('MIME type');
  }

  private value(label: string): Locator {
    return this.root
      .getByRole('row')
      .filter({
        has: this.root.page().getByRole('rowheader', {
          name: label,
          exact: true,
        }),
      })
      .getByRole('cell');
  }
}

/** The window that uploads one file into a file cell or a file input. */
export class FileUploadModal extends Modal {
  /** Opens the file chooser on a click and on Enter, and takes a dropped file. */
  readonly dropZone: Locator;
  readonly progressBar: Locator;
  /** "Uploaded 40%" */
  readonly progress: Locator;
  /** What the window says about the upload that failed last. */
  readonly error: Locator;

  constructor(page: Page) {
    super(page, 'Upload File');
    this.dropZone = this.body.locator('label', { hasText: 'Drag a file here' });
    this.progressBar = this.body.getByRole('progressbar');
    this.progress = this.body.getByText(/^Uploaded \d+%$/);
    this.error = this.body.locator('.error-box');
  }

  /** Picks a file in the file chooser that a click on the drop zone opens. */
  async chooseFile(file: string | FilePayload): Promise<void> {
    const fileChooser = this.root.page().waitForEvent('filechooser');
    await this.dropZone.click();
    await (await fileChooser).setFiles(file);
  }

  /** Drops a file on the drop zone, as a drag from the file manager does. */
  async dropFile(file: FilePayload): Promise<void> {
    const dataTransfer = await this.root.page().evaluateHandle(
      ({ name, mimeType, base64 }) => {
        const bytes = Uint8Array.from(atob(base64), (char) =>
          char.charCodeAt(0),
        );
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], name, { type: mimeType }));
        return transfer;
      },
      {
        name: file.name,
        mimeType: file.mimeType,
        base64: file.buffer.toString('base64'),
      },
    );
    await this.dropZone.dispatchEvent('drop', { dataTransfer });
  }
}

/** Asks before a file is removed from a cell or a field. */
export class RemoveFileConfirmation extends Modal {
  readonly removeButton: Locator;

  constructor(page: Page) {
    super(page, 'Remove File');
    this.removeButton = this.button('Remove');
  }
}

/** The details and the actions of a file that is not an image, under the file. */
export class FileDetailDropdown {
  readonly root: Locator;
  readonly details: FileDetails;
  readonly removeButton: Locator;
  readonly downloadLink: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ has: page.getByRole('button', { name: 'Remove' }) });
    this.details = new FileDetails(this.root);
    this.removeButton = this.root.getByRole('button', { name: 'Remove' });
    this.downloadLink = this.root.getByRole('link', { name: 'Download' });
  }
}

/** The large view of an image over the page, with the actions on the file. */
export class Lightbox {
  readonly root: Locator;
  readonly image: Locator;
  /** It has no accessible name. It comes first. */
  readonly closeButton: Locator;
  readonly removeButton: Locator;
  /** Opens `details`. Its accessible name is "Filter", see KNOWN_BUGS.md. */
  readonly infoButton: Locator;
  readonly details: FileDetails;
  /** It has no accessible name while the image is too small for the labels of the buttons. */
  readonly downloadLink: Locator;

  constructor(page: Page) {
    this.root = page.locator('.lightbox');
    this.image = this.root.getByRole('img');
    this.closeButton = this.root.getByRole('button').first();
    this.removeButton = this.root.getByRole('button', { name: 'Remove' });
    this.infoButton = this.root.getByRole('button').filter({ hasText: 'Info' });
    this.details = new FileDetails(page.locator('.info-dropdown-content'));
    this.downloadLink = this.root.getByRole('link');
  }

  /** The text of a button. It is hidden, and a tooltip shows it instead, while the image is small. */
  buttonLabel(name: 'Remove' | 'Info' | 'Download'): Locator {
    return this.root.getByText(name, { exact: true });
  }
}
