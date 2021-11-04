import { derived, writable, get } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import { currentDBId } from '@mathesar/stores/databases';
import { preloadCommonData } from '@mathesar/utils/preloadData';

import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import type { Database, DbType, AbstractTypeResponse } from '@mathesar/App.d';
import type { CancellablePromise } from '@mathesar/components';

const commonData = preloadCommonData();

export interface AbstractType extends Omit<AbstractTypeResponse, 'db_types'> {
  dbTypes: Set<DbType>,
  // In the future, this would be base64 or link to svg. Currently it is just a direct string.
  icon: string,
  defaultDbType?: DbType,
}

export const UnknownAbstractType: AbstractType = {
  name: 'Unknown',
  identifier: 'unknown',
  dbTypes: new Set(),
  icon: '?',
};

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
  switch (typeResponse.identifier) {
    case 'number':
      return '#';
    case 'text':
      return 'T';
    default:
      return '?';
  }
}

// TODO: Remove this temporary function once api sends default db type related information.
function getDefaultDbTypeForType(typeResponse: AbstractTypeResponse) {
  switch (typeResponse.identifier) {
    case 'number':
      return 'NUMERIC';
    case 'text':
      return 'VARCHAR';
    default:
      return typeResponse.db_types[0];
  }
}

function processTypeResponse(abstractTypeReponse: AbstractTypeResponse[]): AbstractTypeStoreData {
  const abstractTypeStoreData: AbstractTypeStoreData = new Map();

  abstractTypeReponse.forEach((entry) => {
    const typeInfo = {
      ...entry,
      dbTypes: new Set(entry.db_types),
      icon: getIconForType(entry),
      defaultDbType: getDefaultDbTypeForType(entry),
    };
    delete typeInfo.db_types;
    abstractTypeStoreData.set(typeInfo.identifier, typeInfo);
  });

  return abstractTypeStoreData;
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

    const abstractTypeStoreData = processTypeResponse(response);

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

let preload = true;

function getTypesForDatabase(databaseId: Database['id']): Writable<AbstractTypeStore> {
  let store = databasesToAbstractTypesStoreMap.get(databaseId);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    databasesToAbstractTypesStoreMap.set(databaseId, store);

    if (preload) {
      preload = false;
      store.update((currentData) => ({
        ...currentData,
        state: States.Done,
        data: processTypeResponse(commonData.abstract_types),
      }));
    } else {
      void refetchTypesForDB(databaseId);
    }
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
  return UnknownAbstractType;
}
