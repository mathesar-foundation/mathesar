import { derived, writable, get } from 'svelte/store';
import type { Readable, Writable, Unsubscriber } from 'svelte/store';

import {
  getAPI,
  postAPI,
  States,
  deleteAPI,
  patchAPI,
} from '@mathesar/utils/api';
import { preloadCommonData } from '@mathesar/utils/preloadData';

import type { SchemaEntry, TableEntry } from '@mathesar/App.d';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar-component-library';

import { currentSchemaId } from './schemas';

const commonData = preloadCommonData();

export interface DBTablesStoreData {
  state: States;
  data: Map<TableEntry['id'], TableEntry>;
  error?: string;
}

const schemaTablesStoreMap: Map<
  SchemaEntry['id'],
  Writable<DBTablesStoreData>
> = new Map();
const schemaTablesRequestMap: Map<
  SchemaEntry['id'],
  CancellablePromise<PaginatedResponse<TableEntry>>
> = new Map();

function sortedTableEntries(tableEntries: TableEntry[]): TableEntry[] {
  return [...tableEntries].sort((a, b) => a.name.localeCompare(b.name));
}

function setSchemaTablesStore(
  schemaId: SchemaEntry['id'],
  tableEntries?: TableEntry[],
): Writable<DBTablesStoreData> {
  const tables: DBTablesStoreData['data'] = new Map();
  if (tableEntries) {
    sortedTableEntries(tableEntries).forEach((entry) => {
      tables.set(entry.id, entry);
    });
  }

  const storeValue: DBTablesStoreData = {
    state: States.Done,
    data: tables,
    error: undefined,
  };

  let store = schemaTablesStoreMap.get(schemaId);
  if (!store) {
    store = writable(storeValue);
    schemaTablesStoreMap.set(schemaId, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

export function removeTablesInSchemaTablesStore(
  schemaId: SchemaEntry['id'],
): void {
  schemaTablesStoreMap.delete(schemaId);
}

export async function refetchTablesForSchema(
  schemaId: SchemaEntry['id'],
): Promise<DBTablesStoreData | undefined> {
  const store = schemaTablesStoreMap.get(schemaId);
  if (!store) {
    console.error(`Tables store for schema: ${schemaId} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    schemaTablesRequestMap.get(schemaId)?.cancel();

    const tablesRequest = getAPI<PaginatedResponse<TableEntry>>(
      `/api/db/v0/tables/?schema=${schemaId}&limit=500`,
    );
    schemaTablesRequestMap.set(schemaId, tablesRequest);
    const response = await tablesRequest;
    const tableEntries = response.results || [];

    const schemaTablesStore = setSchemaTablesStore(schemaId, tableEntries);

    return get(schemaTablesStore);
  } catch (err) {
    store.update((currentData) => ({
      ...currentData,
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    }));
    return undefined;
  }
}

let preload = true;

export function getTablesStoreForSchema(
  schemaId: SchemaEntry['id'],
): Writable<DBTablesStoreData> {
  let store = schemaTablesStoreMap.get(schemaId);
  if (!store) {
    store = writable({
      state: States.Loading,
      data: new Map(),
    });
    schemaTablesStoreMap.set(schemaId, store);
    if (preload) {
      preload = false;
      store = setSchemaTablesStore(schemaId, commonData?.tables ?? []);
    } else {
      void refetchTablesForSchema(schemaId);
    }
  } else if (get(store).error) {
    void refetchTablesForSchema(schemaId);
  }
  return store;
}

export function deleteTable(id: number): CancellablePromise<TableEntry> {
  return deleteAPI(`/api/db/v0/tables/${id}/`);
}

export function renameTable(
  id: number,
  name: string,
): CancellablePromise<TableEntry> {
  return patchAPI(`/api/db/v0/tables/${id}/`, { name });
}

export function createTable(
  schema: SchemaEntry['id'],
  name?: string,
): CancellablePromise<TableEntry> {
  return postAPI<TableEntry>('/api/db/v0/tables/', { schema, name });
}

export const tables: Readable<DBTablesStoreData> = derived(
  currentSchemaId,
  ($currentSchemaId, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentSchemaId) {
      set({
        state: States.Done,
        data: new Map(),
      });
    } else {
      const store = getTablesStoreForSchema($currentSchemaId);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);
