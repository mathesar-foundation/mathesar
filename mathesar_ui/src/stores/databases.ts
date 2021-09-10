import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

import type { Database } from '@mathesar/App.d';
import type { PaginatedResponse } from '@mathesar/utils/api';
import { notEmpty } from '@mathesar/utils/language';
import type { CancellablePromise } from '@mathesar/components';

const commonData = preloadCommonData();

export const currentDBName: Writable<Database['name']> = writable(
  commonData.current_db || null,
);

export interface DatabaseStoreData {
  preload?: boolean,
  state: States,
  data?: Database[],
  error?: string
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  state: States.Loading,
  // TODO an empty list is ambiguous, undefined would be preferable
  data: commonData.databases || [],
});

export const currentDBId: Readable<Database['id']> = derived(
  [currentDBName, databases],
  // eslint-disable-next-line @typescript-eslint/no-shadow
  ([currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const databases = databasesStore.data;
    return notEmpty(databases)
      ? databases.find((database) => database.name === currentDBName).id
      : undefined;
  },
);

let databaseRequest: CancellablePromise<PaginatedResponse<Database>>;

export async function reloadDatabases(): Promise<PaginatedResponse<Database>> {
  databases.update((currentData) => ({
    ...currentData,
    state: States.Loading,
  }));

  try {
    databaseRequest?.cancel();
    databaseRequest = getAPI<PaginatedResponse<Database>>('/databases/?limit=500');
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
