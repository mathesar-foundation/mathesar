import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { Schema } from '@mathesar/api/rpc/schemas';
import type { Database } from '@mathesar/models/Database';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import type { CancellablePromise } from '@mathesar-component-library';

import { databasesStore } from './databases';

const commonData = preloadCommonData();

export const currentSchemaId: Writable<Schema['oid'] | undefined> = writable(
  commonData.current_schema ?? undefined,
);

export interface DBSchemaStoreData {
  requestStatus: RequestStatus;
  data: Map<Schema['oid'], Schema>;
}

const dbSchemaStoreMap: Map<
  Database['id'],
  Writable<DBSchemaStoreData>
> = new Map();
const dbSchemasRequestMap: Map<
  Database['id'],
  CancellablePromise<Schema[]>
> = new Map();

function setDBSchemaStore(
  databaseId: Database['id'],
  schemas: Schema[],
): Writable<DBSchemaStoreData> {
  const schemaMap: DBSchemaStoreData['data'] = new Map();
  schemas.forEach((schema) => {
    schemaMap.set(schema.oid, schema);
  });
  const storeValue: DBSchemaStoreData = {
    requestStatus: { state: 'success' },
    data: schemaMap,
  };

  let store = dbSchemaStoreMap.get(databaseId);
  if (!store) {
    store = writable(storeValue);
    dbSchemaStoreMap.set(databaseId, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

function updateSchemaInDBSchemaStore(
  databaseId: Database['id'],
  schema: Schema,
) {
  const store = dbSchemaStoreMap.get(databaseId);
  if (store) {
    store.update((value) => {
      value.data?.set(schema.oid, schema);
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

function removeSchemaInDBSchemaStore(
  databaseId: Database['id'],
  schemaId: Schema['oid'],
) {
  const store = dbSchemaStoreMap.get(databaseId);
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
  database: Pick<Database, 'id'>,
  schema: Schema,
  count: number,
) {
  const store = dbSchemaStoreMap.get(database.id);
  if (store) {
    store.update((value) => {
      const schemaToModify = value.data.get(schema.oid);
      if (schemaToModify) {
        schemaToModify.table_count += count;
        value.data.set(schema.oid, schemaToModify);
      }
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

async function refetchSchemasForDB(
  databaseId: Database['id'],
): Promise<DBSchemaStoreData | undefined> {
  const store = dbSchemaStoreMap.get(databaseId);
  if (!store) {
    console.error(`DB Schemas store for database: ${databaseId} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    dbSchemasRequestMap.get(databaseId)?.cancel();

    const schemaRequest = api.schemas.list({ database_id: databaseId }).run();
    dbSchemasRequestMap.set(databaseId, schemaRequest);
    const schemas = await schemaRequest;

    const dbSchemasStore = setDBSchemaStore(databaseId, schemas);

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
  databaseId: Database['id'],
): Writable<DBSchemaStoreData> {
  let store = dbSchemaStoreMap.get(databaseId);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      data: new Map(),
    });
    dbSchemaStoreMap.set(databaseId, store);
    if (preload && commonData.current_database === databaseId) {
      store = setDBSchemaStore(databaseId, commonData.schemas ?? []);
    } else {
      void refetchSchemasForDB(databaseId);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchSchemasForDB(databaseId);
  }
  return store;
}

export function getSchemaInfo(
  databaseId: Database['id'],
  schemaId: Schema['oid'],
): Schema | undefined {
  const store = dbSchemaStoreMap.get(databaseId);
  if (!store) {
    return undefined;
  }
  return get(store).data.get(schemaId);
}

export async function createSchema(
  databaseId: Database['id'],
  name: Schema['name'],
  description: Schema['description'],
): Promise<void> {
  const schemaOid = await api.schemas
    .add({
      database_id: databaseId,
      name,
      description,
    })
    .run();
  updateSchemaInDBSchemaStore(databaseId, {
    oid: schemaOid,
    name,
    description,
    table_count: 0,
  });
}

export async function updateSchema(
  databaseId: Database['id'],
  schema: Schema,
): Promise<void> {
  await api.schemas
    .patch({
      database_id: databaseId,
      schema_oid: schema.oid,
      patch: {
        name: schema.name,
        description: schema.description,
      },
    })
    .run();
  updateSchemaInDBSchemaStore(databaseId, schema);
}

export async function deleteSchema(
  databaseId: Database['id'],
  schemaId: Schema['oid'],
): Promise<void> {
  await api.schemas
    .delete({
      database_id: databaseId,
      schema_oid: schemaId,
    })
    .run();
  removeSchemaInDBSchemaStore(databaseId, schemaId);
}

export const schemas: Readable<DBSchemaStoreData> = derived(
  databasesStore.currentDatabaseId,
  ($currentDatabaseId, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDatabaseId) {
      set({
        requestStatus: { state: 'success' },
        data: new Map(),
      });
    } else {
      const store = getSchemasStoreForDB($currentDatabaseId);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);

export const currentSchema: Readable<Schema | undefined> = derived(
  [currentSchemaId, schemas],
  ([$currentSchemaId, $schemas]) =>
    $currentSchemaId ? $schemas.data.get($currentSchemaId) : undefined,
);
