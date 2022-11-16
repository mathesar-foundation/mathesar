/**
 * @file
 *
 * TODO This file **badly** needs to be refactored, cleaned up, and made to
 * function more consistently with the rest of the codebase.
 *
 * - For values of type `Writable<DBTablesStoreData>`, we seem to be using using
 *   names like `schemaStore`, `tableStore`, `tablesStore`, `schemaTablesStore`
 *   almost interchangeably which is a readability nightmare.
 *
 * - Tables need to be sorted before being stored, but that sorting happens in
 *   many different places. I suggest having a derived store that does the
 *   sorting.
 */

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
import type {
  SplitTableResponse,
  TableEntry,
  MinimalColumnDetails,
} from '@mathesar/api/tables';
import type { PaginatedResponse } from '@mathesar/utils/api';
import { CancellablePromise } from '@mathesar-component-library';

import { currentSchemaId } from './schemas';
import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';

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
    if (preload && commonData?.current_schema === schemaId) {
      store = setSchemaTablesStore(schemaId, commonData?.tables ?? []);
    } else {
      void refetchTablesForSchema(schemaId);
    }
    preload = false;
  } else if (get(store).error) {
    void refetchTablesForSchema(schemaId);
  }
  return store;
}

/**
 * TODO: Use a dedicated higher level Tables store and
 * remove this function.
 */
function findSchemaStoreForTable(id: TableEntry['id']) {
  return [...schemaTablesStoreMap.values()].find((entry) =>
    get(entry).data.has(id),
  );
}

function findAndUpdateTableStore(id: TableEntry['id'], tableEntry: TableEntry) {
  findSchemaStoreForTable(id)?.update((tableStoreData) => {
    const existingTableEntry = tableStoreData.data.get(id);
    const updatedTableEntry = {
      ...(existingTableEntry ?? {}),
      ...tableEntry,
    };
    tableStoreData.data.set(id, updatedTableEntry);
    const tableEntryMap: DBTablesStoreData['data'] = new Map();
    sortedTableEntries([...tableStoreData.data.values()]).forEach((entry) => {
      tableEntryMap.set(entry.id, entry);
    });
    return {
      ...tableStoreData,
      data: tableEntryMap,
    };
  });
}

export function deleteTable(id: number): CancellablePromise<TableEntry> {
  const promise = deleteAPI<TableEntry>(`/api/db/v0/tables/${id}/`);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((value) => {
        findSchemaStoreForTable(id)?.update((tableStoreData) => {
          tableStoreData.data.delete(id);
          return {
            ...tableStoreData,
            data: new Map(tableStoreData.data),
          };
        });
        return resolve(value);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function renameTable(
  id: number,
  name: string,
): CancellablePromise<TableEntry> {
  const promise = patchAPI<TableEntry>(`/api/db/v0/tables/${id}/`, { name });
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((value) => {
        findAndUpdateTableStore(id, value);
        return resolve(value);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function createTable(
  schema: SchemaEntry['id'],
  tableArgs: {
    name?: string;
    dataFiles?: [number, ...number[]];
  },
): CancellablePromise<TableEntry> {
  const promise = postAPI<TableEntry>('/api/db/v0/tables/', {
    schema,
    name: tableArgs.name,
    data_files: tableArgs.dataFiles,
  });
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((value) => {
        schemaTablesStoreMap.get(value.schema)?.update((existing) => {
          const tableEntryMap: DBTablesStoreData['data'] = new Map();
          sortedTableEntries([...existing.data.values(), value]).forEach(
            (entry) => {
              tableEntryMap.set(entry.id, entry);
            },
          );
          return {
            ...existing,
            data: tableEntryMap,
          };
        });
        return resolve(value);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function patchTable(
  id: TableEntry['id'],
  patch: {
    name?: TableEntry['name'];
    import_verified?: TableEntry['import_verified'];
    columns?: MinimalColumnDetails[];
  },
): CancellablePromise<TableEntry> {
  const promise = patchAPI<TableEntry>(`/api/db/v0/tables/${id}/`, patch);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((value) => {
        findAndUpdateTableStore(id, value);
        return resolve(value);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
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

export function splitTable(
  id: number,
  idsOfColumnsToExtract: number[],
  extractedTableName: string,
): CancellablePromise<SplitTableResponse> {
  return postAPI(`/api/db/v0/tables/${id}/split_table/`, {
    extract_columns: idsOfColumnsToExtract,
    extracted_table_name: extractedTableName,
  });
}

export function moveColumns(
  tableId: number,
  idsOfColumnsToMove: number[],
  targetTableId: number,
): CancellablePromise<null> {
  return postAPI(`/api/db/v0/tables/${tableId}/move_columns/`, {
    move_columns: idsOfColumnsToMove,
    target_table: targetTableId,
  });
}

/**
 * Replace getTable with this function once the above mentioned changes are done.
 */
export function getTableFromStoreOrApi(
  id: TableEntry['id'],
): CancellablePromise<TableEntry> {
  const schemaStore = findSchemaStoreForTable(id);
  if (schemaStore) {
    const tableEntry = get(schemaStore).data.get(id);
    if (tableEntry) {
      return new CancellablePromise((resolve) => {
        resolve(tableEntry);
      });
    }
  }
  const promise = getTable(id);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        const store = schemaTablesStoreMap.get(table.schema);
        if (store) {
          store.update((existing) => {
            const tableMap = new Map<number, TableEntry>();
            const tables = [...existing.data.values(), table];
            sortedTableEntries(tables).forEach((t) => {
              tableMap.set(t.id, t);
            });
            return {
              ...existing,
              data: tableMap,
            };
          });
        }
        return resolve(table);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
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

export function getJoinableTablesResult(tableId: number) {
  return getAPI<JoinableTablesResult>(
    `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=1`,
  );
}
