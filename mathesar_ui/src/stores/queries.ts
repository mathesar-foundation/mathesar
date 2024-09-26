/**
 * @file
 *
 * TODO: Our store structures need a complete refactoring.
 *
 * 1. We have to avoid exporting stores directly and export
 * functions that return promises and wait on the promise
 * wherever we use the stores.
 *
 * 2. The map structure used in individual stores should be more linear.
 * Eg., Schemas store should contain the ids of it's tables and queries,
 * and each individual store should only contain a map with the id and
 * the db object associated with the store.
 *
 * 3. Each operation within a store file, should update the store.
 * Eg., create should create a new object and update the respective queries
 * and schemas store.
 *
 * 4. Pure API calls should be separated and moved to the /api directory.
 *
 * This store would be a good place to start since the usage
 * is limited compared to the other stores.
 *
 * Note: Some methods in this file directly make use of currentSchemaId,
 * and they need to be refactored to get schemaId as an argument.
 *
 * Reason behing using currentSchemaId:
 * Initially, queries were not designed on the backend to be part of schemas,
 * i.e. queries were on the same hierarchial level as schemas. The frontend
 * followed the same structure on this store. The UX however, expects queries
 * to be placed within schemas. This conflict was handled on this store leading
 * to having us use the currentSchemaId store directly.
 */

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
import type {
  AddableExploration,
  ExplorationResult,
  SavedExploration,
} from '@mathesar/api/rpc/explorations';
import type { Schema } from '@mathesar/models/Schema';
import CacheManager from '@mathesar/utils/CacheManager';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import type { CancellablePromise } from '@mathesar-component-library';

import { currentSchema } from './schemas';

const commonData = preloadCommonData();

export interface QueriesStoreSubstance {
  schemaId: Schema['oid'];
  requestStatus: RequestStatus;
  data: Map<SavedExploration['id'], SavedExploration>;
}

// Cache the query list of the last 3 opened schemas
const schemasCacheManager = new CacheManager<
  Schema['oid'],
  Writable<QueriesStoreSubstance>
>(3);

const requestMap: Map<
  Schema['oid'],
  CancellablePromise<SavedExploration[]>
> = new Map();

function sortedQueryEntries(
  queryEntries: SavedExploration[],
): SavedExploration[] {
  return [...queryEntries].sort((a, b) => a.name?.localeCompare(b.name));
}

function setSchemaQueriesStore(
  schemaId: Schema['oid'],
  queryEntries?: SavedExploration[],
): Writable<QueriesStoreSubstance> {
  const queries: QueriesStoreSubstance['data'] = new Map();
  if (queryEntries) {
    sortedQueryEntries(queryEntries).forEach((entry) => {
      queries.set(entry.id, entry);
    });
  }

  const storeValue: QueriesStoreSubstance = {
    schemaId,
    requestStatus: { state: 'success' },
    data: queries,
  };

  let store = schemasCacheManager.get(schemaId);
  if (!store) {
    store = writable(storeValue);
    schemasCacheManager.set(schemaId, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

function findSchemaStoreForQuery(id: SavedExploration['id']) {
  return [...schemasCacheManager.cache.values()].find((entry) =>
    get(entry).data.has(id),
  );
}

export async function refetchExplorationsForSchema(schema: {
  oid: number;
  database: { id: number };
}): Promise<QueriesStoreSubstance | undefined> {
  const store = schemasCacheManager.get(schema.oid);
  if (!store) {
    console.error(`Queries store for schema: ${schema.oid} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    requestMap.get(schema.oid)?.cancel();

    const queriesRequest = api.explorations
      .list({
        database_id: schema.database.id,
        schema_oid: schema.oid,
      })
      .run();
    requestMap.set(schema.oid, queriesRequest);

    const queriesResult = await queriesRequest;
    const schemaQueriesStore = setSchemaQueriesStore(schema.oid, queriesResult);

    return get(schemaQueriesStore);
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

export function getExplorationsStoreForSchema(schema: {
  oid: number;
  database: { id: number };
}): Writable<QueriesStoreSubstance> {
  let store = schemasCacheManager.get(schema.oid);
  if (!store) {
    store = writable({
      schemaId: schema.oid,
      requestStatus: { state: 'processing' },
      data: new Map(),
    });
    schemasCacheManager.set(schema.oid, store);
    if (preload && commonData.current_schema === schema.oid) {
      store = setSchemaQueriesStore(schema.oid, commonData.queries ?? []);
    } else {
      void refetchExplorationsForSchema(schema);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchExplorationsForSchema(schema);
  }
  return store;
}

export const queries: Readable<Omit<QueriesStoreSubstance, 'schemaId'>> =
  derived(currentSchema, ($currentSchema, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentSchema) {
      set({
        requestStatus: { state: 'success' },
        data: new Map(),
      });
    } else {
      const store = getExplorationsStoreForSchema($currentSchema);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  });

export function addExploration(
  exploration: AddableExploration,
): CancellablePromise<SavedExploration> {
  const promise = api.explorations.add({ exploration_def: exploration }).run();
  void promise.then((savedExploration) => {
    void refetchExplorationsForSchema({
      oid: savedExploration.schema_oid,
      database: { id: exploration.database_id },
    });
    return savedExploration;
  });
  return promise;
}

export function replaceExploration(
  exploration: SavedExploration,
): CancellablePromise<SavedExploration> {
  const promise = api.explorations
    .replace({ new_exploration: exploration })
    .run();

  void promise.then((newlySavedExploration) => {
    const schemaId = newlySavedExploration.schema_oid;
    const store = getExplorationsStoreForSchema({
      oid: schemaId,
      database: { id: newlySavedExploration.database_id },
    });
    get(store).data.set(exploration.id, newlySavedExploration);
    setSchemaQueriesStore(schemaId, [...get(store).data.values()]);
    return undefined;
  });

  return promise;
}

export function getExploration(
  id: SavedExploration['id'],
): CancellablePromise<SavedExploration> {
  return api.explorations.get({ exploration_id: id }).run();
}

export function runSavedExploration(
  id: number,
  params: {
    limit: number;
    offset: number;
  },
): CancellablePromise<ExplorationResult> {
  return api.explorations
    .run_saved({
      exploration_id: id,
      limit: params.limit,
      offset: params.offset,
    })
    .run();
}

export function deleteExploration(id: number): CancellablePromise<void> {
  const promise = api.explorations.delete({ exploration_id: id }).run();

  void promise.then(() => {
    const store = findSchemaStoreForQuery(id);
    if (store) {
      store.update((storeData) => {
        storeData.data.delete(id);
        return { ...storeData, data: new Map(storeData.data) };
      });
    }
    return undefined;
  });
  return promise;
}
