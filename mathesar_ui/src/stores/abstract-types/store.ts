import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';

import type { CancellablePromise } from '@mathesar-component-library';
import type { Connection } from '@mathesar/api/rest/connections';
import { States, getAPI } from '@mathesar/api/rest/utils/requestUtils';
import { currentDatabase } from '@mathesar/stores/databases';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { constructAbstractTypeMapFromResponse } from './abstractTypeCategories';
import type {
  AbstractTypeResponse,
  AbstractTypesMap,
  AbstractTypesSubstance,
} from './types';

const commonData = preloadCommonData();

const databasesToAbstractTypesStoreMap: Map<
  Connection['id'],
  Writable<AbstractTypesSubstance>
> = new Map();
const abstractTypesRequestMap: Map<
  Connection['id'],
  CancellablePromise<AbstractTypeResponse[]>
> = new Map();

export async function refetchTypesForDb(
  databaseId: Connection['id'],
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
      `/api/ui/v0/connections/${databaseId}/types/`,
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

function getTypesForConnection(
  connection: Connection,
): Writable<AbstractTypesSubstance> {
  let store = databasesToAbstractTypesStoreMap.get(connection.id);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    databasesToAbstractTypesStoreMap.set(connection.id, store);

    if (preload && commonData.current_connection === connection.id) {
      store.update((currentData) => ({
        ...currentData,
        state: States.Done,
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        data: constructAbstractTypeMapFromResponse(commonData.abstract_types),
      }));
    } else {
      void refetchTypesForDb(connection.id);
    }
    preload = false;
  } else if (get(store).error) {
    void refetchTypesForDb(connection.id);
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
      const store = getTypesForConnection($currentDatabase);
      unsubscribe = store.subscribe((typesData) => {
        set(typesData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);
