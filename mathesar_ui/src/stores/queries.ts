import { derived, writable, get } from 'svelte/store';
import type { Readable, Writable, Unsubscriber } from 'svelte/store';
import { getAPI, postAPI, putAPI } from '@mathesar/utils/api';
import type { RequestStatus, PaginatedResponse } from '@mathesar/utils/api';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import CacheManager from '@mathesar/utils/CacheManager';
import type { SchemaEntry } from '@mathesar/AppTypes';
import type { QueryInstance } from '@mathesar/api/queries/queryList';
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
): CancellablePromise<QueryInstance> {
  const promise = postAPI<QueryInstance>('/api/db/v0/queries/', newQuery);
  void promise.then(() => {
    // TODO: Get schemaId as a query property
    const schemaId = get(currentSchemaId);
    if (schemaId) {
      void refetchQueriesForSchema(schemaId);
    }
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
        const store = schemasCacheManager.get(schemaId);
        if (store) {
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
        }
      },
      () => {
        innerRequest?.cancel();
      },
    );
  }
  return new CancellablePromise((resolve) => resolve());
}
