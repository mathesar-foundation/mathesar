import { readFile } from 'node:fs/promises';

import type { Locator, Page } from '@playwright/test';

import type { TablePage } from './table-page';

export interface DownloadedFile {
  name: string;
  content: string;
}

/** The Export link in the Table tab of the inspector, which downloads the records as CSV. */
export class TableExportLink {
  readonly root: Locator;
  readonly help: Locator;
  private readonly page: Page;

  constructor(tablePage: TablePage) {
    this.page = tablePage.page;
    this.root = tablePage.inspector.link('Export');
    this.help = this.root.getByLabel('Help');
  }

  /** Clicks the link and reads the file that the browser receives. */
  async download(): Promise<DownloadedFile> {
    const download = this.page.waitForEvent('download');
    await this.root.click();
    const file = await download;
    return {
      name: file.suggestedFilename(),
      content: await readFile(await file.path(), 'utf8'),
    };
  }
}
