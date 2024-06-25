import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';

import type { Connection } from '@mathesar/api/rest/connections';
import schemasApi from '@mathesar/api/rest/schemas';
import type {
  PaginatedResponse,
  RequestStatus,
} from '@mathesar/api/rest/utils/requestUtils';
import type { SchemaEntry, SchemaResponse } from '@mathesar/AppTypes';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import type { CancellablePromise } from '@mathesar-component-library';

import { connectionsStore } from './databases';

const commonData = preloadCommonData();

export const currentSchemaId: Writable<SchemaEntry['id'] | undefined> =
  writable(commonData.current_schema ?? undefined);

export interface DBSchemaStoreData {
  requestStatus: RequestStatus;
  data: Map<SchemaEntry['id'], SchemaEntry>;
}

const dbSchemaStoreMap: Map<
  Connection['id'],
  Writable<DBSchemaStoreData>
> = new Map();
const dbSchemasRequestMap: Map<
  Connection['id'],
  CancellablePromise<PaginatedResponse<SchemaResponse> | undefined>
> = new Map();

function findStoreBySchemaId(id: SchemaEntry['id']) {
  return [...dbSchemaStoreMap.values()].find((entry) =>
    get(entry).data.has(id),
  );
}

function setDBSchemaStore(
  connectionId: Connection['id'],
  schemas: SchemaResponse[],
): Writable<DBSchemaStoreData> {
  const schemaMap: DBSchemaStoreData['data'] = new Map();
  schemas.forEach((schema) => {
    schemaMap.set(schema.id, schema);
  });
  const storeValue: DBSchemaStoreData = {
    requestStatus: { state: 'success' },
    data: schemaMap,
  };

  let store = dbSchemaStoreMap.get(connectionId);
  if (!store) {
    store = writable(storeValue);
    dbSchemaStoreMap.set(connectionId, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

function updateSchemaInDBSchemaStore(
  connectionId: Connection['id'],
  schema: SchemaResponse,
) {
  const store = dbSchemaStoreMap.get(connectionId);
  if (store) {
    store.update((value) => {
      value.data?.set(schema.id, schema);
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

function removeSchemaInDBSchemaStore(
  connectionId: Connection['id'],
  schemaId: SchemaEntry['id'],
) {
  const store = dbSchemaStoreMap.get(connectionId);
  if (store) {
    store.update((value) => {
      value.data?.delete(schemaId);
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

export function addCountToSchemaNumTables(
  connection: Connection,
  schema: SchemaEntry,
  count: number,
) {
  const store = dbSchemaStoreMap.get(connection.id);
  if (store) {
    store.update((value) => {
      const schemaToModify = value.data.get(schema.id);
      if (schemaToModify) {
        schemaToModify.num_tables += count;
        value.data.set(schema.id, schemaToModify);
      }
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

export function addCountToSchemaNumExplorations(
  schemaId: SchemaEntry['id'],
  count: number,
) {
  const store = findStoreBySchemaId(schemaId);
  if (store) {
    store.update((value) => {
      const schemaToModify = value.data.get(schemaId);
      if (schemaToModify) {
        schemaToModify.num_queries += count;
        value.data.set(schemaId, schemaToModify);
      }
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

async function refetchSchemasForDB(
  connectionId: Connection['id'],
): Promise<DBSchemaStoreData | undefined> {
  const store = dbSchemaStoreMap.get(connectionId);
  if (!store) {
    console.error(
      `DB Schemas store for connection: ${connectionId} not found.`,
    );
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    dbSchemasRequestMap.get(connectionId)?.cancel();

    const schemaRequest = schemasApi.list(connectionId);
    dbSchemasRequestMap.set(connectionId, schemaRequest);
    const response = await schemaRequest;
    const schemas = response?.results || [];

    const dbSchemasStore = setDBSchemaStore(connectionId, schemas);

    return get(dbSchemasStore);
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: {
        state: 'failure',
        errors: [
          err instanceof Error ? err.message : 'Error in fetching schemas',
        ],
      },
    }));
    return undefined;
  }
}

let preload = true;

function getSchemasStoreForDB(
  connectionId: Connection['id'],
): Writable<DBSchemaStoreData> {
  let store = dbSchemaStoreMap.get(connectionId);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      data: new Map(),
    });
    dbSchemaStoreMap.set(connectionId, store);
    if (preload && commonData.current_connection === connectionId) {
      store = setDBSchemaStore(connectionId, commonData.schemas ?? []);
    } else {
      void refetchSchemasForDB(connectionId);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchSchemasForDB(connectionId);
  }
  return store;
}

export function getSchemaInfo(
  connectionId: Connection['id'],
  schemaId: SchemaEntry['id'],
): SchemaEntry | undefined {
  const store = dbSchemaStoreMap.get(connectionId);
  if (!store) {
    return undefined;
  }
  return get(store).data.get(schemaId);
}

export async function createSchema(
  connectionId: Connection['id'],
  schemaName: SchemaEntry['name'],
  description: SchemaEntry['description'],
): Promise<SchemaResponse> {
  const response = await schemasApi.add({
    name: schemaName,
    description,
    connectionId,
  });
  updateSchemaInDBSchemaStore(connectionId, response);
  return response;
}

export async function updateSchema(
  connectionId: Connection['id'],
  schema: SchemaEntry,
): Promise<SchemaResponse> {
  const response = await schemasApi.update(schema);
  updateSchemaInDBSchemaStore(connectionId, response);
  return response;
}

export async function deleteSchema(
  connectionId: Connection['id'],
  schemaId: SchemaEntry['id'],
): Promise<void> {
  await schemasApi.delete(schemaId);
  removeSchemaInDBSchemaStore(connectionId, schemaId);
}

export const schemas: Readable<DBSchemaStoreData> = derived(
  connectionsStore.currentConnectionId,
  ($currentConnectionName, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentConnectionName) {
      set({
        requestStatus: { state: 'success' },
        data: new Map(),
      });
    } else {
      const store = getSchemasStoreForDB($currentConnectionName);
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
