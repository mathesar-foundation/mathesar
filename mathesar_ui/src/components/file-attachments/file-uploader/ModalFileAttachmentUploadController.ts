import { type Readable, type Writable, writable } from 'svelte/store';

import type {
  FileAttachmentRequestParams,
  FileAttachmentUploadResult,
} from '@mathesar/api/rest/fileAttachments';

export default class ModalFileAttachmentUploadController {
  private resolve:
    | ((result: FileAttachmentUploadResult | undefined) => void)
    | undefined;

  private _isOpen = writable(false);

  isOpen: Readable<boolean>;

  private _requestParams: Writable<FileAttachmentRequestParams | undefined> =
    writable(undefined);

  get requestParams(): Readable<FileAttachmentRequestParams | undefined> {
    return this._requestParams;
  }

  constructor() {
    this.isOpen = this._isOpen;
  }

  async acquireFileAttachment(
    reqParams?: FileAttachmentRequestParams,
  ): Promise<FileAttachmentUploadResult | undefined> {
    this._isOpen.set(true);
    this._requestParams.set(reqParams);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  submitResult(result: FileAttachmentUploadResult | undefined) {
    this.resolve?.(result);
    this._isOpen.set(false);
    this._requestParams.set(undefined);
  }

  cancel() {
    this.submitResult(undefined);
  }
}
