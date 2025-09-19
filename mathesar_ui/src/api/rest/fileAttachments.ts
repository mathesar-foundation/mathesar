import type { CancellablePromise } from '@mathesar-component-library';

import type { FileManifest } from '../rpc/records';

import { type UploadCompletionOpts, uploadFile } from './utils/requestUtils';

const ENDPOINT = '/files/';

export interface FileAttachmentUploadResult {
  /** The value to set in the cell into which the file was uploaded */
  result: string;
  download_link: FileManifest;
}

export function uploadFileAttachment(
  file: File,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<FileAttachmentUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadFile(ENDPOINT, formData, completionCallback);
}
