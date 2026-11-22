import fs from 'node:fs';

import type { APIRequestContext } from '@playwright/test';

/** A file in the storage of the stack, as a cell of a File column refers to it. */
export interface StoredFile {
  uri: string;
  mash: string;
}

/**
 * Uploads a file as the Upload File window does, in the browser session of the
 * request context: the endpoint needs a session and a CSRF token, not basic auth.
 */
export async function uploadFile(
  request: APIRequestContext,
  path: string,
): Promise<StoredFile> {
  const { cookies } = await request.storageState();
  const csrfToken = cookies.find(({ name }) => name === 'csrftoken')?.value;
  const response = await request.post('/files/', {
    headers: { 'X-CSRFToken': csrfToken ?? '' },
    multipart: { file: fs.createReadStream(path) },
  });
  if (!response.ok()) {
    throw new Error(`Upload of ${path} failed: ${await response.text()}`);
  }
  const { result } = (await response.json()) as { result: string };
  const { uri, mash } = JSON.parse(result) as StoredFile;
  return { uri, mash };
}
