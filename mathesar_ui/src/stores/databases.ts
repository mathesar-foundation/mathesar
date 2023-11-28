import { writable, derived } from 'svelte/store';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import databaseApi from '@mathesar/api/databases';

import type { Writable } from 'svelte/store';
import type { Database } from '@mathesar/AppTypes';
import type {
  RequestStatus,
  PaginatedResponse,
} from '@mathesar/api/utils/requestUtils';
import { getApiErrorMessages } from '@mathesar/api/utils/errors';
import type { CancellablePromise } from '@mathesar-component-library';

const commonData = preloadCommonData();

export const currentDBName: Writable<Database['nickname'] | undefined> =
  writable(commonData?.current_db_connection ?? undefined);

export interface DatabaseStoreData {
  preload?: boolean;
  requestStatus: RequestStatus;
  data: Database[];
  error?: string;
}

export const databases = writable<DatabaseStoreData>({
  preload: true,
  requestStatus: { state: 'success' },
  data: commonData?.connections ?? [],
});

export const currentDatabase = derived(
  [currentDBName, databases],
  ([_currentDBName, databasesStore]) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _databases = databasesStore.data;
    if (!_databases?.length) {
      return undefined;
    }
    return _databases?.find((database) => database.nickname === _currentDBName);
  },
);

let databaseRequest: CancellablePromise<PaginatedResponse<Database>>;

export async function reloadDatabases(): Promise<
  PaginatedResponse<Database> | undefined
> {
  databases.update((currentData) => ({
    ...currentData,
    requestStatus: { state: 'processing' },
  }));

  try {
    databaseRequest?.cancel();
    databaseRequest = databaseApi.list();
    const response = await databaseRequest;
    const data = response.results || [];
    databases.set({
      requestStatus: { state: 'success' },
      data,
    });
    return response;
  } catch (err) {
    databases.set({
      data: [],
      requestStatus: { state: 'failure', errors: getApiErrorMessages(err) },
    });
    return undefined;
  }
}
