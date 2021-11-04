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

export type AbstractTypesMap = Map<AbstractType['identifier'], AbstractType>;

interface AbstractTypesSubstance {
  state: States,
  data: AbstractTypesMap,
  error?: string
}

const databasesToAbstractTypesStoreMap: Map<Database['id'], Writable<AbstractTypesSubstance>> = new Map();
const abstractTypesRequestMap: Map<Database['id'], CancellablePromise<AbstractTypeResponse[]>> = new Map();

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

function processTypeResponse(abstractTypesResponse: AbstractTypeResponse[]): AbstractTypesMap {
  const abstractTypesMap: AbstractTypesMap = new Map();

  abstractTypesResponse.forEach((entry) => {
    const typeInfo = {
      ...entry,
      dbTypes: new Set(entry.db_types),
      icon: getIconForType(entry),
      defaultDbType: getDefaultDbTypeForType(entry),
    };
    delete typeInfo.db_types;
    abstractTypesMap.set(typeInfo.identifier, typeInfo);
  });

  return abstractTypesMap;
}

export async function refetchTypesForDB(databaseId: Database['id']): Promise<AbstractTypesMap> {
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

    abstractTypesRequestMap.get(databaseId)?.cancel();

    const typesRequest = getAPI<AbstractTypeResponse[]>(`/databases/${databaseId}/types/`);
    abstractTypesRequestMap.set(databaseId, typesRequest);
    const response = await typesRequest;

    const abstractTypesMap = processTypeResponse(response);

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
    return null;
  }
}

let preload = true;

function getTypesForDatabase(databaseId: Database['id']): Writable<AbstractTypesSubstance> {
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

export const abstractTypes: Readable<AbstractTypesSubstance> = derived(
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
  dbType: DbType, abstractTypesMap: AbstractTypesMap,
): AbstractType | null {
  if (dbType && abstractTypesMap) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [, abstractType] of abstractTypesMap) {
      if (abstractType.dbTypes.has(dbType)) {
        return abstractType;
      }
    }
  }
  return UnknownAbstractType;
}
