import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable, Unsubscriber } from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';
import type { PaginatedResponse } from '@mathesar/utils/api';

import type { Database, SchemaEntry, SchemaResponse } from '@mathesar/AppTypes';
import type { CancellablePromise } from '@mathesar-component-library';

import { currentDBName } from './databases';

const commonData = preloadCommonData();

export const currentSchemaId: Writable<SchemaEntry['id'] | undefined> =
  writable(commonData?.current_schema || undefined);

export interface DBSchemaStoreData {
  state: States;
  data: Map<SchemaEntry['id'], SchemaEntry>;
  error?: string;
}

const dbSchemaStoreMap: Map<
  Database['name'],
  Writable<DBSchemaStoreData>
> = new Map();
const dbSchemasRequestMap: Map<
  Database['name'],
  CancellablePromise<PaginatedResponse<SchemaResponse> | undefined>
> = new Map();

function setDBSchemaStore(
  database: Database['name'],
  schemas: SchemaResponse[],
): Writable<DBSchemaStoreData> {
  const schemaMap: DBSchemaStoreData['data'] = new Map();
  schemas.forEach((schema) => {
    schemaMap.set(schema.id, schema);
  });
  const storeValue: DBSchemaStoreData = {
    state: States.Done,
    data: schemaMap,
    error: undefined,
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
): Promise<DBSchemaStoreData | undefined> {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    console.error(`DB Schemas store for db: ${database} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    dbSchemasRequestMap.get(database)?.cancel();

    const schemaRequest = getAPI<PaginatedResponse<SchemaResponse>>(
      `/api/db/v0/schemas/?database=${database}&limit=500`,
    );
    dbSchemasRequestMap.set(database, schemaRequest);
    const response = await schemaRequest;
    const schemas = response?.results || [];

    const dbSchemasStore = setDBSchemaStore(database, schemas);

    return get(dbSchemasStore);
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    }));
    return undefined;
  }
}

export async function refetchSchema(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
): Promise<SchemaResponse | undefined> {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    console.error(`DB Schemas store for db: ${database} not found.`);
    return undefined;
  }

  const url = `/api/db/v0/schemas/${schemaId}/`;
  try {
    const schemaRequest = getAPI<SchemaResponse>(url);
    const response = await schemaRequest;
    if (!response) {
      return undefined;
    }
    updateSchemaInDBSchemaStore(database, response);
    return response;
  } catch (err) {
    return undefined;
  }
}

let preload = true;

export function getSchemasStoreForDB(
  database: Database['name'],
): Writable<DBSchemaStoreData> {
  let store = dbSchemaStoreMap.get(database);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    dbSchemaStoreMap.set(database, store);

    if (preload) {
      preload = false;
      store = setDBSchemaStore(database, commonData?.schemas || []);
    } else {
      void refetchSchemasForDB(database);
    }
  } else if (get(store).error) {
    void refetchSchemasForDB(database);
  }
  return store;
}

export function getSchemaInfo(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
): SchemaEntry | undefined {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    return undefined;
  }
  return get(store).data.get(schemaId);
}

export async function createSchema(
  database: Database['name'],
  schemaName: SchemaEntry['name'],
  schemaDescription: SchemaEntry['description'],
): Promise<SchemaResponse> {
  const response = await postAPI<SchemaResponse>('/api/db/v0/schemas/', {
    name: schemaName,
    description: schemaDescription,
    database,
  });
  updateSchemaInDBSchemaStore(database, response);
  return response;
}

export async function updateSchema(
  database: Database['name'],
  schema: SchemaEntry,
): Promise<SchemaResponse> {
  const url = `/api/db/v0/schemas/${schema.id}/`;
  const response = await patchAPI<SchemaResponse>(url, {
    name: schema.name,
    description: schema.description,
  });
  updateSchemaInDBSchemaStore(database, response);
  return response;
}

export async function deleteSchema(
  database: Database['name'],
  schemaId: SchemaEntry['id'],
): Promise<void> {
  await deleteAPI(`/api/db/v0/schemas/${schemaId}/`);
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

export const currentSchema: Readable<SchemaEntry | undefined> = derived(
  [currentSchemaId, schemas],
  ([$currentSchemaId, $schemas]) =>
    $currentSchemaId ? $schemas.data.get($currentSchemaId) : undefined,
);
