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

import type { DBObjectEntry, SchemaEntry } from '@mathesar/AppTypes';
import type { TableEntry, MinimalColumnDetails } from '@mathesar/api/tables';
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
  tableArgs: {
    name?: string;
    dataFiles?: [number, ...number[]];
  },
): CancellablePromise<TableEntry> {
  return postAPI<TableEntry>('/api/db/v0/tables/', {
    schema,
    name: tableArgs.name,
    data_files: tableArgs.dataFiles,
  });
}

/**
 * NOTE: The getTable function currently does not get data from the store.
 * We need to keep it that way for the time-being, because the components
 * that call this function expect latest data from the db, while the store
 * contains stale information.
 *
 * TODO:
 * 1. Keep stores upto-date when user performs any action to related db objects.
 * 2. Find a sync mechanism to keep the frontend stores upto-date when
 *    data in db changes.
 * 3. Move all api-call-only functions to /api. Only keep functions that
 *    update the stores within /stores
 */
export function getTable(id: TableEntry['id']): CancellablePromise<TableEntry> {
  return getAPI(`/api/db/v0/tables/${id}/`);
}

export function getTypeSuggestionsForTable(
  id: TableEntry['id'],
): CancellablePromise<Record<string, string>> {
  return getAPI(`/api/db/v0/tables/${id}/type_suggestions/`);
}

export function generateTablePreview(
  id: TableEntry['id'],
  columns: MinimalColumnDetails[],
): CancellablePromise<{
  records: Record<string, unknown>[];
}> {
  return postAPI(`/api/db/v0/tables/${id}/previews/`, { columns });
}

export function patchTable(
  id: TableEntry['id'],
  patch: {
    name?: TableEntry['name'];
    import_verified?: TableEntry['import_verified'];
    columns?: MinimalColumnDetails[];
  },
): CancellablePromise<TableEntry> {
  return patchAPI(`/api/db/v0/tables/${id}/`, patch);
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

export function getTableName(id: DBObjectEntry['id']): string | undefined {
  return get(tables).data.get(id)?.name;
}

export const currentTableId = writable<number | undefined>(undefined);

export const currentTable = derived(
  [currentTableId, tables],
  ([$currentTableId, $tables]) =>
    $currentTableId === undefined
      ? undefined
      : $tables.data.get($currentTableId),
);
