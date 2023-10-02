import { writable, derived } from 'svelte/store';
import {
  isSuccessfullyConnectedDatabase,
  preloadCommonData,
} from '@mathesar/utils/preloadData';
import databaseApi from '@mathesar/api/databases';
import { States } from '@mathesar/api/utils/requestUtils';

import type { Writable } from 'svelte/store';
import type {
  SuccessfullyConnectedDatabase,
  Database,
} from '@mathesar/AppTypes';
import type { PaginatedResponse } from '@mathesar/api/utils/requestUtils';
import type { CancellablePromise } from '@mathesar-component-library';

const commonData = preloadCommonData();

export const currentDBName: Writable<Database['name'] | undefined> = writable(
  commonData?.current_db ?? undefined,
);

export interface DatabaseStoreData {
  preload?: boolean;
  state: States;
  data: Database[];
  error?: string;
  successfulConnections: SuccessfullyConnectedDatabase[];
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  state: States.Loading,
  data: commonData?.databases ?? [],
  successfulConnections: (commonData?.databases ?? []).filter(
    (database): database is SuccessfullyConnectedDatabase =>
      !('error' in database),
  ),
});

export const currentDatabase = derived(
  [currentDBName, databases],
  ([_currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _databases = databasesStore.successfulConnections;
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
    databaseRequest = databaseApi.list();
    const response = await databaseRequest;
    const data = response.results || [];
    const successDatabases = data.filter(isSuccessfullyConnectedDatabase);
    databases.set({
      state: States.Done,
      data,
      successfulConnections: successDatabases,
    });
    return response;
  } catch (err) {
    databases.set({
      data: [],
      successfulConnections: [],
      state: States.Error,
      error: err instanceof Error ? err.message : undefined,
    });
    return undefined;
  }
}
