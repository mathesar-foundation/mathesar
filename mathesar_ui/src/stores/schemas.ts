import {
  writable,
  derived,
  get,
} from 'svelte/store';
import type {
  Writable,
  Readable,
  Unsubscriber,
} from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';
import type { PaginatedResponse } from '@mathesar/utils/api';

import type {
  Database,
  SchemaEntry,
  SchemaResponse,
} from '@mathesar/App.d';
import type { CancellablePromise } from '@mathesar/components';

import { currentDBName } from './databases';

const commonData = preloadCommonData();

export const currentSchemaId: Writable<SchemaEntry['id']> = writable(
  commonData.current_schema || null,
);

export interface DBSchemaStoreData {
  state: States,
  data: Map<SchemaEntry['id'], SchemaEntry>,
  error?: string
}

const dbSchemaStoreMap: Map<Database['name'], Writable<DBSchemaStoreData>> = new Map();
const dbSchemasRequestMap: Map<Database['name'], CancellablePromise<PaginatedResponse<SchemaResponse>>> = new Map();

function setDBSchemaStore(
  database: Database['name'],
  schemas: SchemaResponse[],
): Writable<DBSchemaStoreData> {
  const schemaMap: DBSchemaStoreData['data'] = new Map();
  schemas.forEach((schema) => {
    schemaMap.set(schema.id, schema);
  });
  const storeValue = {
    state: States.Done,
    data: schemaMap,
    error: null,
  };

  let store = dbSchemaStoreMap.get(database);
  if (!store) {
    store = writable(storeValue);
    dbSchemaStoreMap.set(database, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

function updateSchemaInDBSchemaStore(
  database: Database['name'],
  schema: SchemaResponse,
) {
  const store = dbSchemaStoreMap.get(database);
  if (store) {
    store.update((value) => {
      value.data?.set(schema.id, schema);
      return {
        ...value,
      };
    });
  }
}

function removeSchemaInDBSchemaStore(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
) {
  const store = dbSchemaStoreMap.get(database);
  if (store) {
    store.update((value) => {
      value.data?.delete(schemaId);
      return {
        ...value,
      };
    });
  }
}

export async function refetchSchemasForDB(
  database: Database['name'],
): Promise<DBSchemaStoreData> {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    console.error(`DB Schemas store for db: ${database} not found.`);
    return null;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    dbSchemasRequestMap.get(database)?.cancel();

    const schemaRequest = getAPI<PaginatedResponse<SchemaResponse>>(`/schemas/?database=${database}&limit=500`);
    dbSchemasRequestMap.set(database, schemaRequest);
    const response = await schemaRequest;
    const schemas = response.results || [];

    const dbSchemasStore = setDBSchemaStore(database, schemas);

    return get(dbSchemasStore);
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    }));
    return null;
  }
}

export async function refetchSchema(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
): Promise<SchemaResponse> {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    console.error(`DB Schemas store for db: ${database} not found.`);
    return null;
  }

  try {
    const schemaRequest = getAPI<SchemaResponse>(`/schemas/${schemaId}/`);
    const response = await schemaRequest;
    updateSchemaInDBSchemaStore(database, response);
    return response;
  } catch (err) {
    return null;
  }
}

let preload = true;

export function getSchemasStoreForDB(database: Database['name']): Writable<DBSchemaStoreData> {
  let store = dbSchemaStoreMap.get(database);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    dbSchemaStoreMap.set(database, store);

    if (preload) {
      preload = false;
      store = setDBSchemaStore(database, commonData.schemas || []);
    } else {
      void refetchSchemasForDB(database);
    }
  } else if (get(store).error) {
    void refetchSchemasForDB(database);
  }
  return store;
}

export function getSchemaInfo(database: Database['name'], schemaId: SchemaEntry['id']): SchemaEntry {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    return null;
  }
  return get(store).data.get(schemaId);
}

export async function createSchema(
  database: Database['name'],
  schemaName: SchemaEntry['name'],
): Promise<SchemaResponse> {
  const response = await postAPI<SchemaResponse>('/schemas/', {
    name: schemaName,
    database,
  });
  updateSchemaInDBSchemaStore(database, response);
  return response;
}

export async function updateSchema(
  database: Database['name'],
  schema: SchemaEntry,
): Promise<SchemaResponse> {
  const response = await patchAPI<SchemaResponse>(`/schemas/${schema.id}/`, {
    name: schema.name,
  });
  updateSchemaInDBSchemaStore(database, response);
  return response;
}

export async function deleteSchema(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
): Promise<void> {
  await deleteAPI(`/schemas/${schemaId}/`);
  removeSchemaInDBSchemaStore(database, schemaId);
}

export const schemas: Readable<DBSchemaStoreData> = derived(
  currentDBName,
  ($currentDBName, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDBName) {
      set({
        state: States.Done,
        data: new Map(),
      });
    } else {
      const store = getSchemasStoreForDB($currentDBName);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);

export const currentSchema: Readable<SchemaEntry> = derived(
  [currentSchemaId, schemas],
  ([$currentSchemaId, $schemas], set) => {
    if (!currentSchemaId) {
      set(null);
    } else {
      set($schemas.data.get($currentSchemaId));
    }
  },
);
