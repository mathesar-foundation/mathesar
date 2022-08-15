import { writable, derived } from 'svelte/store';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

import type { Writable, Readable } from 'svelte/store';
import type { Database } from '@mathesar/AppTypes';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar-component-library';

const commonData = preloadCommonData();

export const currentDBName: Writable<Database['name'] | undefined> = writable(
  commonData?.current_db ?? undefined,
);

export interface DatabaseStoreData {
  preload?: boolean;
  state: States;
  data?: Database[];
  error?: string;
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  state: States.Loading,
  data: commonData?.databases ?? [],
});

export const currentDBId: Readable<Database['id'] | undefined> = derived(
  [currentDBName, databases],
  ([_currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _databases = databasesStore.data;
    if (!_databases?.length) {
      return undefined;
    }
    return _databases?.find((database) => database.name === _currentDBName)?.id;
  },
);

export const currentDatabase = derived(
  [currentDBName, databases],
  ([_currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _databases = databasesStore.data;
    if (!_databases?.length) {
      return undefined;
    }
    return _databases?.find((database) => database.name === _currentDBName);
  },
);

let databaseRequest: CancellablePromise<PaginatedResponse<Database>>;

export async function reloadDatabases(): Promise<
  PaginatedResponse<Database> | undefined
> {
  databases.update((currentData) => ({
    ...currentData,
    state: States.Loading,
  }));

  try {
    databaseRequest?.cancel();
    databaseRequest = getAPI<PaginatedResponse<Database>>(
      '/api/db/v0/databases/?limit=500',
    );
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
      error: err instanceof Error ? err.message : undefined,
    });
    return undefined;
  }
}
