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

import { derived, get, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type {
  AddableExploration,
  ExplorationResult,
  SavedExploration,
} from '@mathesar/api/rpc/explorations';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import { getErrorMessage } from '@mathesar/utils/errors';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { type CancellablePromise, collapse } from '@mathesar-component-library';

import { currentSchema } from './schemas';

const commonData = preloadCommonData();

export interface QueriesStoreSubstance {
  databaseId?: Database['id'];
  schemaOid?: Schema['oid'];
  requestStatus: RequestStatus;
  data: Map<SavedExploration['id'], SavedExploration>;
}

function makeEmptyQueriesStoreSubstance(): QueriesStoreSubstance {
  return {
    data: new Map(),
    requestStatus: { state: 'success' },
  };
}

const queriesStore = writable(makeEmptyQueriesStoreSubstance());

function sortedQueryEntries(
  queryEntries: SavedExploration[],
): SavedExploration[] {
  return [...queryEntries].sort((a, b) => a.name?.localeCompare(b.name));
}

function setExplorationsStore(
  schema: Schema,
  queryEntries: SavedExploration[],
) {
  const queries: QueriesStoreSubstance['data'] = new Map();
  sortedQueryEntries(queryEntries).forEach((entry) => {
    queries.set(entry.id, entry);
  });

  queriesStore.set({
    databaseId: schema.database.id,
    schemaOid: schema.oid,
    data: queries,
    requestStatus: { state: 'success' },
  });
}

let request: CancellablePromise<SavedExploration[]>;

export async function fetchExplorationsForCurrentSchema(): Promise<void> {
  request?.cancel();

  const $currentSchema = get(currentSchema);
  if (!$currentSchema) {
    queriesStore.set(makeEmptyQueriesStoreSubstance());
    return;
  }

  try {
    queriesStore.update(($queriesStore) => {
      if (
        $queriesStore.databaseId === $currentSchema.database.id &&
        $queriesStore.schemaOid === $currentSchema.oid
      ) {
        return {
          ...$queriesStore,
          requestStatus: { state: 'processing' },
        };
      }
      return {
        databaseId: $currentSchema.database.id,
        schemaOid: $currentSchema.oid,
        data: new Map(),
        requestStatus: { state: 'processing' },
      };
    });

    request = api.explorations
      .list({
        database_id: $currentSchema.database.id,
        schema_oid: $currentSchema.oid,
      })
      .run();

    const queriesResult = await request;
    setExplorationsStore($currentSchema, queriesResult);
  } catch (err) {
    queriesStore.update(($queriesStore) => {
      if (
        $queriesStore.databaseId === $currentSchema.database.id &&
        $queriesStore.schemaOid === $currentSchema.oid
      ) {
        return {
          ...$queriesStore,
          requestStatus: {
            state: 'failure',
            errors: [getErrorMessage(err)],
          },
        };
      }
      return {
        databaseId: $currentSchema.database.id,
        schemaOid: $currentSchema.oid,
        data: new Map(),
        requestStatus: {
          state: 'failure',
          errors: [getErrorMessage(err)],
        },
      };
    });
  }
}

function putExplorationInStore(exploration: SavedExploration) {
  const $currentSchema = get(currentSchema);
  if (!$currentSchema) {
    return;
  }

  if (
    exploration.database_id === $currentSchema.database.id &&
    exploration.schema_oid === $currentSchema.oid
  ) {
    const queryData = get(queriesStore).data.set(exploration.id, exploration);
    setExplorationsStore($currentSchema, [...queryData.values()]);
  }
}

export function addExploration(
  exploration: AddableExploration,
): CancellablePromise<SavedExploration> {
  const promise = api.explorations.add({ exploration_def: exploration }).run();
  void promise.then((savedExploration) => {
    putExplorationInStore(savedExploration);
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
    putExplorationInStore(newlySavedExploration);
    return newlySavedExploration;
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

  const $queriesStore = get(queriesStore);
  const $currentSchema = get(currentSchema);
  if (
    $queriesStore.databaseId === $currentSchema?.database.id &&
    $queriesStore.schemaOid === $currentSchema?.oid
  ) {
    $queriesStore.data.delete(id);
    queriesStore.update((store) => ({
      ...store,
      data: new Map($queriesStore.data),
    }));
  }

  return promise;
}

let preload = true;

export const queries = collapse(
  derived(currentSchema, ($currentSchema) => {
    const $queriesStore = get(queriesStore);
    if (
      $queriesStore.databaseId !== $currentSchema?.database.id ||
      $queriesStore.schemaOid !== $currentSchema?.oid
    ) {
      if (
        preload &&
        commonData.current_schema === $currentSchema?.oid &&
        commonData.current_database === $currentSchema?.database.id
      ) {
        setExplorationsStore($currentSchema, commonData.queries);
      } else {
        void fetchExplorationsForCurrentSchema();
      }
      preload = false;
    } else if ($queriesStore.requestStatus.state === 'failure') {
      void fetchExplorationsForCurrentSchema();
    }
    return queriesStore;
  }),
);
