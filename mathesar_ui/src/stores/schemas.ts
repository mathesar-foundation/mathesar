import {
  type Readable,
  type Unsubscriber,
  type Writable,
  derived,
  get,
  writable,
} from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { RawSchema } from '@mathesar/api/rpc/schemas';
import type { Database } from '@mathesar/models/Database';
import { Schema } from '@mathesar/models/Schema';
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
  CancellablePromise<RawSchema[]>
> = new Map();

function setDBSchemaStore(
  database: Database,
  rawSchemas: RawSchema[],
): Writable<DBSchemaStoreData> {
  const schemaMap: DBSchemaStoreData['data'] = new Map();
  rawSchemas.forEach((rawSchema) => {
    schemaMap.set(rawSchema.oid, new Schema({ database, rawSchema }));
  });
  const storeValue: DBSchemaStoreData = {
    requestStatus: { state: 'success' },
    data: schemaMap,
  };

  let store = dbSchemaStoreMap.get(database.id);
  if (!store) {
    store = writable(storeValue);
    dbSchemaStoreMap.set(database.id, store);
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

function removeSchemaInDBSchemaStore(database: Database, schema: Schema) {
  const store = dbSchemaStoreMap.get(database.id);
  if (store) {
    store.update((value) => {
      value.data?.delete(schema.oid);
      return {
        ...value,
        data: new Map(value.data),
      };
    });
  }
}

async function refetchSchemasForDB(
  database: Database,
): Promise<DBSchemaStoreData | undefined> {
  const store = dbSchemaStoreMap.get(database.id);
  if (!store) {
    console.error(`DB Schemas store for database: ${database.id} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    dbSchemasRequestMap.get(database.id)?.cancel();

    const schemaRequest = api.schemas.list({ database_id: database.id }).run();
    dbSchemasRequestMap.set(database.id, schemaRequest);
    const schemas = await schemaRequest;

    const dbSchemasStore = setDBSchemaStore(database, schemas);

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

function getSchemasStoreForDB(database: Database): Writable<DBSchemaStoreData> {
  let store = dbSchemaStoreMap.get(database.id);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      data: new Map(),
    });
    dbSchemaStoreMap.set(database.id, store);
    if (preload && commonData.current_database === database.id) {
      store = setDBSchemaStore(database, commonData.schemas ?? []);
    } else {
      void refetchSchemasForDB(database);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchSchemasForDB(database);
  }
  return store;
}

export async function createSchema(
  database: Database,
  props: {
    name: string;
    description: string | null;
  },
): Promise<void> {
  const schemaOid = await api.schemas
    .add({
      database_id: database.id,
      name: props.name,
      description: props.description,
    })
    .run();
  /**
   * TODO_BETA: Update the following once
   * https://github.com/mathesar-foundation/mathesar/issues/3834 is done.
   */
  const schemaList = await api.schemas.list({ database_id: database.id }).run();
  const rawSchema = schemaList.find((rs) => rs.oid === schemaOid);
  if (!rawSchema) {
    throw new Error('Schema not found');
  }
  updateSchemaInDBSchemaStore(database.id, new Schema({ database, rawSchema }));
}

export async function deleteSchema(schema: Schema): Promise<void> {
  await schema.delete();
  removeSchemaInDBSchemaStore(schema.database, schema);
}

export const schemas: Readable<DBSchemaStoreData> = derived(
  databasesStore.currentDatabase,
  ($currentDatabase, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDatabase) {
      set({
        requestStatus: { state: 'success' },
        data: new Map(),
      });
    } else {
      const store = getSchemasStoreForDB($currentDatabase);
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
