import type { CancellablePromise } from '@mathesar-component-library';

import type { DataFile } from './types/dataFiles';
import {
  type UploadCompletionOpts,
  getAPI,
  patchAPI,
  postAPI,
  uploadFile,
} from './utils/requestUtils';

const ENDPOINT = '/api/db/v0/data_files/';

interface PostParams {
  url?: string;
  paste?: string;
}

function postToEndpoint(body: PostParams) {
  return postAPI<{ id: number }>(ENDPOINT, body);
}

function get(id: number) {
  return getAPI<DataFile>(`${ENDPOINT}${id}/`);
}

function addViaUpload(
  formData: FormData,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<{ id: number }> {
  return uploadFile(ENDPOINT, formData, completionCallback);
}

function update(id: number, properties: { header: boolean }) {
  return patchAPI(`${ENDPOINT}${id}/`, properties);
}

export const dataFilesApi = {
  addViaUrlToFile: (url: string) => postToEndpoint({ url }),
  addViaText: (paste: string) => postToEndpoint({ paste }),
  addViaUpload,
  get,
  update,
};
