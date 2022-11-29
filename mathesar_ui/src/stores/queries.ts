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
 */

import { derived, writable, get } from 'svelte/store';
import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import { deleteAPI, getAPI, postAPI, putAPI } from '@mathesar/utils/api';
import type { RequestStatus, PaginatedResponse } from '@mathesar/utils/api';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import CacheManager from '@mathesar/utils/CacheManager';
import type { SchemaEntry } from '@mathesar/AppTypes';
import type {
  QueryInstance,
  QueryGetResponse,
  QueryRunRequest,
  QueryRunResponse,
} from '@mathesar/api/types/queries';
import { CancellablePromise } from '@mathesar-component-library';

import { currentSchemaId } from './schemas';

const commonData = preloadCommonData();

export type UnsavedQueryInstance = Partial<QueryInstance>;

export interface QueriesStoreSubstance {
  requestStatus: RequestStatus;
  data: Map<QueryInstance['id'], QueryInstance>;
}

// Cache the query list of the last 3 opened schemas
const schemasCacheManager = new CacheManager<
  SchemaEntry['id'],
  Writable<QueriesStoreSubstance>
>(3);

const requestMap: Map<
  SchemaEntry['id'],
  CancellablePromise<PaginatedResponse<QueryInstance>>
> = new Map();

function sortedQueryEntries(queryEntries: QueryInstance[]): QueryInstance[] {
  return [...queryEntries].sort((a, b) => a.name?.localeCompare(b.name));
}

function setSchemaQueriesStore(
  schemaId: SchemaEntry['id'],
  queryEntries?: QueryInstance[],
): Writable<QueriesStoreSubstance> {
  const queries: QueriesStoreSubstance['data'] = new Map();
  if (queryEntries) {
    sortedQueryEntries(queryEntries).forEach((entry) => {
      queries.set(entry.id, entry);
    });
  }

  const storeValue: QueriesStoreSubstance = {
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

function findSchemaStoreForTable(id: QueryInstance['id']) {
  return [...schemasCacheManager.cache.values()].find((entry) =>
    get(entry).data.has(id),
  );
}

export async function refetchQueriesForSchema(
  schemaId: SchemaEntry['id'],
): Promise<QueriesStoreSubstance | undefined> {
  const store = schemasCacheManager.get(schemaId);
  if (!store) {
    console.error(`Queries store for schema: ${schemaId} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    requestMap.get(schemaId)?.cancel();

    const queriesRequest = getAPI<PaginatedResponse<QueryInstance>>(
      `/api/db/v0/queries/?schema=${schemaId}&limit=500`,
    );
    requestMap.set(schemaId, queriesRequest);

    const response = await queriesRequest;
    const queriesResult = response.results || [];

    const schemaQueriesStore = setSchemaQueriesStore(schemaId, queriesResult);

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

export function getQueriesStoreForSchema(
  schemaId: SchemaEntry['id'],
): Writable<QueriesStoreSubstance> {
  let store = schemasCacheManager.get(schemaId);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      data: new Map(),
    });
    schemasCacheManager.set(schemaId, store);
    if (preload && commonData?.current_schema === schemaId) {
      store = setSchemaQueriesStore(schemaId, commonData?.queries ?? []);
    } else {
      void refetchQueriesForSchema(schemaId);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchQueriesForSchema(schemaId);
  }
  return store;
}

export const queries: Readable<QueriesStoreSubstance> = derived(
  currentSchemaId,
  ($currentSchemaId, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentSchemaId) {
      set({
        requestStatus: { state: 'success' },
        data: new Map(),
      });
    } else {
      const store = getQueriesStoreForSchema($currentSchemaId);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);

export function createQuery(
  newQuery: UnsavedQueryInstance,
): CancellablePromise<QueryGetResponse> {
  const promise = postAPI<QueryGetResponse>('/api/db/v0/queries/', newQuery);
  void promise.then((instance) => {
    void refetchQueriesForSchema(instance.schema);
    return undefined;
  });
  return promise;
}

export function putQuery(
  query: QueryInstance,
): CancellablePromise<QueryInstance> {
  const promise = putAPI<QueryInstance>(
    `/api/db/v0/queries/${query.id}/`,
    query,
  );
  void promise.then((result) => {
    // TODO: Get schemaId as a query property
    const schemaId = get(currentSchemaId);
    if (schemaId) {
      const store = getQueriesStoreForSchema(schemaId);
      get(store).data.set(query.id, result);
      setSchemaQueriesStore(schemaId, [...get(store).data.values()]);
    }
    return undefined;
  });
  return promise;
}

export function getQuery(
  queryId: QueryInstance['id'],
): CancellablePromise<QueryInstance> {
  // TODO: Get schemaId as a query property
  const schemaId = get(currentSchemaId);
  let innerRequest: CancellablePromise<QueryInstance>;
  if (schemaId) {
    return new CancellablePromise<QueryInstance>(
      (resolve, reject) => {
        const store = getQueriesStoreForSchema(schemaId);
        const storeSubstance = get(store);
        const queryResponse = storeSubstance.data.get(queryId);
        if (queryResponse) {
          resolve(queryResponse);
          return;
        }
        if (storeSubstance.requestStatus.state !== 'success') {
          innerRequest = getAPI<QueryInstance>(
            `/api/db/v0/queries/${queryId}/`,
          );
          void innerRequest.then(
            (result) => resolve(result),
            (reason) => reject(reason),
          );
        } else {
          reject(new Error('Query not found'));
        }
      },
      () => {
        innerRequest?.cancel();
      },
    );
  }
  return new CancellablePromise((resolve) => resolve());
}

export function runQuery(
  request: QueryRunRequest,
): CancellablePromise<QueryRunResponse> {
  return postAPI('/api/db/v0/queries/run/', request);
}

export function deleteQuery(queryId: number): CancellablePromise<void> {
  const promise = deleteAPI<void>(`/api/db/v0/queries/${queryId}/`);

  void promise.then(() => {
    findSchemaStoreForTable(queryId)?.update((storeData) => {
      storeData.data.delete(queryId);
      return { ...storeData, data: new Map(storeData.data) };
    });
    return undefined;
  });
  return promise;
}
