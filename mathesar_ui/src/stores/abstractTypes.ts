import { derived, writable, get } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import { currentDBId } from '@mathesar/stores/databases';

import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import type { Database, DbType } from '@mathesar/App.d';
import type { CancellablePromise } from '@mathesar/components';

export interface FilterConfiguration {
  db_type: DbType,
  opitons: {
    op?: string,
    value?: {
      allowed_types: DbType[]
    }
  }[]
}

interface AbstractTypeResponse {
  name: string,
  identifier: string,
  db_types: DbType[],
  filters?: FilterConfiguration
}

export interface AbstractType extends Omit<AbstractTypeResponse, 'db_types'> {
  dbTypes: Set<DbType>,
  // In the future, this would be base64 or link to svg. Currently it is just a direct string.
  icon: string
}

export type AbstractTypeStoreData = Map<AbstractType['identifier'], AbstractType>;

export interface AbstractTypeStore {
  state: States,
  data: AbstractTypeStoreData,
  error?: string
}

const databasesToAbstractTypesStoreMap: Map<Database['id'], Writable<AbstractTypeStore>> = new Map();
const dbMTTypesRequestMap: Map<Database['id'], CancellablePromise<AbstractTypeResponse[]>> = new Map();

// TODO: Remove this temporary function once api sends icon related information.
function getIconForType(typeResponse: AbstractTypeResponse) {
  return '#';
}

export async function refetchTypesForDB(databaseId: Database['id']): Promise<AbstractTypeStoreData> {
  const store = databasesToAbstractTypesStoreMap.get(databaseId);
  if (!store) {
    console.error(`DB Types store for db: ${databaseId} not found.`);
    return null;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    dbMTTypesRequestMap.get(databaseId)?.cancel();

    const typesRequest = getAPI<AbstractTypeResponse[]>(`/databases/${databaseId}/types/`);
    dbMTTypesRequestMap.set(databaseId, typesRequest);
    const response = await typesRequest;

    const abstractTypeStoreData: AbstractTypeStoreData = new Map();

    response.forEach((entry) => {
      const typeInfo = {
        ...entry,
        dbTypes: new Set(entry.db_types),
        icon: getIconForType(entry),
      };
      delete typeInfo.db_types;
      abstractTypeStoreData.set(typeInfo.identifier, typeInfo);
    });

    store.update((currentData) => ({
      ...currentData,
      state: States.Done,
      data: abstractTypeStoreData,
    }));

    return abstractTypeStoreData;
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    }));
    return null;
  }
}

function getTypesForDatabase(databaseId: Database['id']): Writable<AbstractTypeStore> {
  let store = databasesToAbstractTypesStoreMap.get(databaseId);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    databasesToAbstractTypesStoreMap.set(databaseId, store);

    void refetchTypesForDB(databaseId);
  } else if (get(store).error) {
    void refetchTypesForDB(databaseId);
  }
  return store;
}

export const abstractTypes: Readable<AbstractTypeStore> = derived(
  currentDBId,
  ($currentDBId, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDBId) {
      set({
        state: States.Done,
        data: new Map(),
      });
    } else {
      const store = getTypesForDatabase($currentDBId);
      unsubscribe = store.subscribe((typesData) => {
        set(typesData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);

export function getAbstractTypeForDBType(
  dbType: DbType, abstractTypeStoreData: AbstractTypeStoreData,
): AbstractType | null {
  if (dbType && abstractTypeStoreData) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, abstractType] of abstractTypeStoreData) {
      if (abstractType.dbTypes.has(dbType)) {
        return abstractType;
      }
    }
  }
  return null;
}
