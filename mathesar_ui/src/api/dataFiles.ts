import type { CancellablePromise } from '@mathesar-component-library';
import {
  postAPI,
  uploadFile,
  type UploadCompletionOpts,
} from './utils/requestUtils';

const ENDPOINT = '/api/db/v0/data_files/';

interface PostParams {
  url?: string;
  paste?: string;
}

function postToEndpoint(body: PostParams) {
  return postAPI<{ id: number }>(ENDPOINT, body);
}

function addViaUpload(
  formData: FormData,
  completionCallback?: (obj: UploadCompletionOpts) => unknown,
): CancellablePromise<{ id: number }> {
  return uploadFile(ENDPOINT, formData, completionCallback);
}

export const dataFilesApi = {
  addViaUrlToFile: (url: string) => postToEndpoint({ url }),
  addViaText: (paste: string) => postToEndpoint({ paste }),
  addViaUpload,
};
