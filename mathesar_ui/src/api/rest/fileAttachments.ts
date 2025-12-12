import type { CancellablePromise } from '@mathesar-component-library';

import type { FileManifest } from '../rpc/records';

import {
  type UploadCompletionOpts,
  addQueryParamsToUrl,
  uploadFile,
} from './utils/requestUtils';

const ENDPOINT = '/files/';

export interface FileAttachmentUploadResult {
  /** The value to set in the cell into which the file was uploaded */
  result: string;
  download_link: FileManifest;
}

type FileAttachmentQueryParamsForPublicForm = {
  form_token: string;
  form_field_key: string;
};

export type FileAttachmentRequestParams =
  FileAttachmentQueryParamsForPublicForm;

export function uploadFileAttachment(
  file: File,
  queryParams?: FileAttachmentRequestParams,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<FileAttachmentUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return uploadFile(
    addQueryParamsToUrl(ENDPOINT, queryParams),
    formData,
    completionCallback,
  );
}
