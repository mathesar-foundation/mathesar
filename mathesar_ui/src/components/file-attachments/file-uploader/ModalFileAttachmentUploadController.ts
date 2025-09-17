import { type Readable, writable } from 'svelte/store';

import type { FileAttachmentUploadResult } from '@mathesar/api/rest/fileAttachments';

export default class ModalFileAttachmentUploadController {
  private resolve:
    | ((result: FileAttachmentUploadResult | undefined) => void)
    | undefined;

  private _isOpen = writable(false);

  isOpen: Readable<boolean>;

  constructor() {
    this.isOpen = this._isOpen;
  }

  async acquireFileAttachment(): Promise<
    FileAttachmentUploadResult | undefined
  > {
    this._isOpen.set(true);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  submitResult(result: FileAttachmentUploadResult | undefined) {
    this.resolve?.(result);
    this._isOpen.set(false);
  }

  cancel() {
    this.submitResult(undefined);
  }
}
