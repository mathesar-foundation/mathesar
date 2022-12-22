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

import type { Readable, Unsubscriber, Writable } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';

import {
  CancellablePromise,
  type RecursivePartial,
} from '@mathesar-component-library';
import type {
  MinimalColumnDetails,
  TableEntry,
} from '@mathesar/api/types/tables';
import type {
  SplitTableRequest,
  SplitTableResponse,
} from '@mathesar/api/types/tables/split_table';
import type { DBObjectEntry, SchemaEntry } from '@mathesar/AppTypes';
import { invalidIf } from '@mathesar/components/form';
import type { PaginatedResponse } from '@mathesar/api/utils/requestUtils';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  States,
} from '@mathesar/api/utils/requestUtils';
import { preloadCommonData } from '@mathesar/utils/preloadData';

import type { JoinableTablesResult } from '@mathesar/api/types/tables/joinable_tables';
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

export function splitTable({
  id,
  idsOfColumnsToExtract,
  extractedTableName,
  newFkColumnName,
}: {
  id: number;
  idsOfColumnsToExtract: number[];
  extractedTableName: string;
  newFkColumnName?: string;
}): CancellablePromise<SplitTableResponse> {
  const body: SplitTableRequest = {
    extract_columns: idsOfColumnsToExtract,
    extracted_table_name: extractedTableName,
    relationship_fk_column_name: newFkColumnName,
  };
  return postAPI(`/api/db/v0/tables/${id}/split_table/`, body);
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

export const validateNewTableName = derived(tables, ($tables) => {
  const names = new Set([...$tables.data.values()].map((t) => t.name));
  return invalidIf(
    (name: string) => names.has(name),
    'A table with that name already exists.',
  );
});

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

export function getJoinableTablesResult(tableId: number, maxDepth = 1) {
  return getAPI<JoinableTablesResult>(
    `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=${maxDepth}`,
  );
}

type TableSettings = TableEntry['settings'];

export async function saveTableSettings(
  table: Pick<TableEntry, 'id' | 'settings' | 'schema'>,
  settings: RecursivePartial<TableSettings>,
): Promise<void> {
  const url = `/api/db/v0/tables/${table.id}/settings/${table.settings.id}/`;
  await patchAPI<TableSettings>(url, settings);
  await refetchTablesForSchema(table.schema);
}

export function saveRecordSummaryTemplate(
  table: Pick<TableEntry, 'id' | 'settings' | 'schema'>,
  previewSettings: TableSettings['preview_settings'],
): Promise<void> {
  const { customized } = previewSettings;
  return saveTableSettings(table, {
    preview_settings: customized ? previewSettings : { customized },
  });
}

export function saveColumnOrder(
  table: Pick<TableEntry, 'id' | 'settings' | 'schema'>,
  columnOrder: TableSettings['column_order'],
): Promise<void> {
  return saveTableSettings(table, {
    column_order: columnOrder
  });
}