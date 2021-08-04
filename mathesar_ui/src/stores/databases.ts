import {
  writable,
  Writable,
} from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

import type { Database } from '@mathesar/App.d';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';

const commonData = preloadCommonData();
const selected: Database = commonData.databases?.find(
  (entry) => entry.name === commonData.selected_db,
) || null;
export const selectedDB: Writable<Database> = writable(selected);

export interface DatabaseStoreData {
  preload?: boolean,
  state: States,
  data?: Database[],
  error?: string
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  state: States.Loading,
  data: commonData.databases || [],
});

let databaseRequest: CancellablePromise<PaginatedResponse<Database>>;

export async function reloadDatabases(): Promise<PaginatedResponse<Database>> {
  databases.update((currentData) => ({
    ...currentData,
    state: States.Loading,
  }));

  try {
    databaseRequest?.cancel();
    databaseRequest = getAPI<PaginatedResponse<Database>>('/databases/');
    const response = await databaseRequest;
    const data = response.results || [];
    databases.set({
      state: States.Done,
      data,
    });
    return response;
  } catch (err) {
    databases.set({
      state: States.Error,
      error: err instanceof Error ? err.message : null,
    });
    return null;
  }
}
