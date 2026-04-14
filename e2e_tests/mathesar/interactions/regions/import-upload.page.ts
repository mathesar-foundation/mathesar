import type { Page } from '@playwright/test';

export class ImportUploadPage {
  constructor(private page: Page) {}

  get heading() {
    return this.page.getByRole('heading', {
      name: 'Create a table by importing your data',
    });
  }

  get fileInput() { return this.page.locator('input[type="file"]'); }
  get proceedButton() { return this.page.getByRole('button', { name: 'Proceed' }); }
  get resetButton() { return this.page.getByRole('button', { name: 'Reset' }); }

  uploadedFileLabel(filename: string) {
    return this.page.getByText(filename);
  }

  async uploadFile(path: string) {
    await this.fileInput.setInputFiles(path);
  }
}
