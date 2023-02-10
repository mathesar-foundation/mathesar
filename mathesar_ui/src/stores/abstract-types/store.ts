import { derived, writable, get } from 'svelte/store';
import { getAPI, States } from '@mathesar/api/utils/requestUtils';
import { currentDatabase } from '@mathesar/stores/databases';
import { preloadCommonData } from '@mathesar/utils/preloadData';

import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import type { Database } from '@mathesar/AppTypes';
import type { CancellablePromise } from '@mathesar-component-library';
import type {
  AbstractTypesMap,
  AbstractTypesSubstance,
  AbstractTypeResponse,
} from './types';

import { constructAbstractTypeMapFromResponse } from './abstractTypeCategories';

const commonData = preloadCommonData();

const databasesToAbstractTypesStoreMap: Map<
  Database['id'],
  Writable<AbstractTypesSubstance>
> = new Map();
const abstractTypesRequestMap: Map<
  Database['id'],
  CancellablePromise<AbstractTypeResponse[]>
> = new Map();

export async function refetchTypesForDb(
  databaseId: Database['id'],
): Promise<AbstractTypesMap | undefined> {
  const store = databasesToAbstractTypesStoreMap.get(databaseId);
  if (!store) {
    console.error(`DB Types store for db: ${databaseId} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    abstractTypesRequestMap.get(databaseId)?.cancel();

    const typesRequest = getAPI<AbstractTypeResponse[]>(
      `/api/ui/v0/databases/${databaseId}/types/`,
    );
    abstractTypesRequestMap.set(databaseId, typesRequest);
    const response = await typesRequest;

    const abstractTypesMap = constructAbstractTypeMapFromResponse(response);

    store.update((currentData) => ({
      ...currentData,
      state: States.Done,
      data: abstractTypesMap,
    }));

    return abstractTypesMap;
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    }));
    return undefined;
  }
}

/**
 * TODO: Find a better way to preload data instead of using this variable.
 * Each store needs to be able to use the common data and preloading is
 * specific to each of them and not common.
 */
let preload = true;

function getTypesForDatabase(
  database: Database,
): Writable<AbstractTypesSubstance> {
  let store = databasesToAbstractTypesStoreMap.get(database.id);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    databasesToAbstractTypesStoreMap.set(database.id, store);

    if (preload && commonData?.current_db === database.name) {
      store.update((currentData) => ({
        ...currentData,
        state: States.Done,
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        data: constructAbstractTypeMapFromResponse(commonData.abstract_types),
      }));
    } else {
      void refetchTypesForDb(database.id);
    }
    preload = false;
  } else if (get(store).error) {
    void refetchTypesForDb(database.id);
  }
  return store;
}

export const currentDbAbstractTypes: Readable<AbstractTypesSubstance> = derived(
  currentDatabase,
  ($currentDatabase, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDatabase) {
      set({
        state: States.Done,
        data: new Map(),
      });
    } else {
      const store = getTypesForDatabase($currentDatabase);
      unsubscribe = store.subscribe((typesData) => {
        set(typesData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);
