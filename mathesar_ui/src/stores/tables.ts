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

import type { JoinableTablesResult } from '@mathesar/api/rest/types/tables/joinable_tables';
import type {
  SplitTableRequest,
  SplitTableResponse,
} from '@mathesar/api/rest/types/tables/split_table';
import type {
  PaginatedResponse,
  RequestStatus,
} from '@mathesar/api/rest/utils/requestUtils';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
} from '@mathesar/api/rest/utils/requestUtils';
import type { Schema } from '@mathesar/api/rpc/schemas';
import type { Table } from '@mathesar/api/rpc/tables';
import type { DBObjectEntry, Database } from '@mathesar/AppTypes';
import { invalidIf } from '@mathesar/components/form';
import type { AtLeastOne } from '@mathesar/typeUtils';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
import {
  CancellablePromise,
  type RecursivePartial,
} from '@mathesar-component-library';

import { addCountToSchemaNumTables, currentSchemaId } from './schemas';

const commonData = preloadCommonData();

type TablesMap = Map<Table['oid'], Table>;

interface TablesData {
  tablesMap: TablesMap;
  requestStatus: RequestStatus;
}

type TablesStore = Writable<TablesData>;

const tablesStores: Map<Schema['oid'], TablesStore> = new Map();

const tablesRequests: Map<
  Schema['oid'],
  CancellablePromise<Table[]>
> = new Map();

function sortTables(tables: Iterable<Table>): Table[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name));
}

function setTablesStore(
  schemaOid: Schema['oid'],
  tables?: Table[],
): TablesStore {
  const tablesMap: TablesMap = new Map();
  if (tables) {
    sortTables(tables).forEach((t) => tablesMap.set(t.oid, t));
  }

  const storeValue: TablesData = {
    tablesMap,
    requestStatus: { state: 'success' },
  };

  let store = tablesStores.get(schemaOid);
  if (!store) {
    store = writable(storeValue);
    tablesStores.set(schemaOid, store);
  } else {
    store.set(storeValue);
  }
  return store;
}

export function removeTablesStore(schemaOid: Schema['oid']): void {
  tablesStores.delete(schemaOid);
}

export async function refetchTablesForSchema(
  schemaOid: Schema['oid'],
): Promise<TablesData | undefined> {
  const store = tablesStores.get(schemaOid);
  if (!store) {
    console.error(`Tables store for schema: ${schemaOid} not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    tablesRequests.get(schemaOid)?.cancel();

    const tablesRequest = getAPI<PaginatedResponse<Table>>(
      `/api/db/v0/tables/?schema=${schemaOid}&limit=500`,
    );
    tablesRequests.set(schemaOid, tablesRequest);
    const response = await tablesRequest;
    const tableEntries = response.results || [];

    const schemaTablesStore = setTablesStore(schemaOid, tableEntries);

    return get(schemaTablesStore);
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

function getTablesStore(schemaOid: Schema['oid']): TablesStore {
  let store = tablesStores.get(schemaOid);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      tablesMap: new Map(),
    });
    tablesStores.set(schemaOid, store);
    if (preload && commonData.current_schema === schemaOid) {
      store = setTablesStore(schemaOid, commonData.tables ?? []);
    } else {
      void refetchTablesForSchema(schemaOid);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchTablesForSchema(schemaOid);
  }
  return store;
}

function findSchemaStoreForTable(
  tableOid: Table['oid'],
): TablesStore | undefined {
  // TODO rewrite this function
  throw new Error('Not implemented');
}

function findAndUpdateTableStore(tableOid: Table['oid'], newTable: Table) {
  findSchemaStoreForTable(tableOid)?.update((tablesData) => {
    const oldTable = tablesData.tablesMap.get(tableOid);
    tablesData.tablesMap.set(tableOid, { ...(oldTable ?? {}), ...newTable });
    const tablesMap: TablesMap = new Map();
    sortTables([...tablesData.tablesMap.values()]).forEach((t) => {
      tablesMap.set(t.oid, t);
    });
    return { ...tablesData, tablesMap };
  });
}

export function deleteTable(
  database: Database,
  schema: Schema,
  tableOid: Table['oid'],
): CancellablePromise<Table> {
  const promise = deleteAPI<Table>(`/api/db/v0/tables/${tableOid}/`);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        addCountToSchemaNumTables(database, schema, -1);
        tablesStores.get(schema.oid)?.update((tableStoreData) => {
          tableStoreData.tablesMap.delete(tableOid);
          return {
            ...tableStoreData,
            tablesMap: new Map(tableStoreData.tablesMap),
          };
        });
        return resolve(table);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function updateTableMetaData(
  tableOid: number,
  updatedMetaData: AtLeastOne<{ name: string; description: string }>,
): CancellablePromise<Table> {
  const promise = patchAPI<Table>(
    `/api/db/v0/tables/${tableOid}/`,
    updatedMetaData,
  );
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        findAndUpdateTableStore(tableOid, table);
        return resolve(table);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function createTable(
  database: Database,
  schema: Schema,
  tableArgs: {
    name?: string;
    dataFiles?: [number, ...number[]];
  },
): CancellablePromise<Table> {
  const promise = postAPI<Table>('/api/db/v0/tables/', {
    schema: schema.oid,
    name: tableArgs.name,
    data_files: tableArgs.dataFiles,
  });
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        addCountToSchemaNumTables(database, schema, 1);
        tablesStores.get(schema.oid)?.update((existing) => {
          const tablesMap: TablesMap = new Map();
          sortTables([...existing.tablesMap.values(), table]).forEach(
            (entry) => {
              tablesMap.set(entry.oid, entry);
            },
          );
          return { ...existing, tablesMap };
        });
        return resolve(table);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

export function patchTable(
  tableOid: Table['oid'],
  patch: {
    name?: Table['name'];
    import_verified?: Table['import_verified'];
    columns?: Table['columns'];
  },
): CancellablePromise<Table> {
  const promise = patchAPI<Table>(`/api/db/v0/tables/${tableOid}/`, patch);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((value) => {
        findAndUpdateTableStore(tableOid, value);
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
export function getTable(tableOid: Table['oid']): CancellablePromise<Table> {
  return getAPI(`/api/db/v0/tables/${tableOid}/`);
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
  tableOid: number,
  idsOfColumnsToMove: number[],
  targetTableId: number,
): CancellablePromise<null> {
  return postAPI(`/api/db/v0/tables/${tableOid}/move_columns/`, {
    move_columns: idsOfColumnsToMove,
    target_table: targetTableId,
  });
}

/**
 * Replace getTable with this function once the above mentioned changes are done.
 */
export function getTableFromStoreOrApi(
  tableOid: Table['oid'],
): CancellablePromise<Table> {
  const tablesStore = findSchemaStoreForTable(tableOid);
  if (tablesStore) {
    const table = get(tablesStore).tablesMap.get(tableOid);
    if (table) {
      return new CancellablePromise((resolve) => {
        resolve(table);
      });
    }
  }
  const promise = getTable(tableOid);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        const store = tablesStores.get(table.schema);
        if (store) {
          store.update((existing) => {
            const tableMap = new Map<number, Table>();
            const tables = [...existing.tablesMap.values(), table];
            sortTables(tables).forEach((t) => {
              tableMap.set(t.oid, t);
            });
            return {
              ...existing,
              tablesMap: tableMap,
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

/**
 * Note the optimizing query parameter. It asserts that the table will not have
 * columns with default values (probably because it is currently being imported
 * and a table produced by importing will not have column defaults). It
 * follows, that this function cannot be used where columns might have defaults.
 */
export function getTypeSuggestionsForTable(
  id: Table['oid'],
): CancellablePromise<Record<string, string>> {
  const optimizingQueryParam = 'columns_might_have_defaults=false';
  return getAPI(
    `/api/db/v0/tables/${id}/type_suggestions/?${optimizingQueryParam}`,
  );
}

export function generateTablePreview(props: {
  table: Pick<Table, 'oid'>;
  columns: Table['columns'];
}): CancellablePromise<{
  records: Record<string, unknown>[];
}> {
  const { columns, table } = props;
  return postAPI(`/api/db/v0/tables/${table.oid}/previews/`, { columns });
}

export const currentTablesData: Readable<TablesData> = derived(
  currentSchemaId,
  ($currentSchemaId, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentSchemaId) {
      set({
        tablesMap: new Map(),
        requestStatus: { state: 'success' },
      });
    } else {
      const store = getTablesStore($currentSchemaId);
      unsubscribe = store.subscribe((dbSchemasData) => {
        set(dbSchemasData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);

export const currentTables = derived(currentTablesData, (tablesData) =>
  sortTables(tablesData.tablesMap.values()),
);

export const importVerifiedTables: Readable<TablesMap> = derived(
  currentTablesData,
  (tablesData) =>
    new Map(
      [...tablesData.tablesMap.values()]
        .filter((table) => !isTableImportConfirmationRequired(table))
        .map((table) => [table.oid, table]),
    ),
);

export const validateNewTableName = derived(currentTablesData, (tablesData) => {
  const names = new Set([...tablesData.tablesMap.values()].map((t) => t.name));
  return invalidIf(
    (name: string) => names.has(name),
    'A table with that name already exists.',
  );
});

export function getTableName(id: DBObjectEntry['id']): string | undefined {
  return get(currentTablesData).tablesMap.get(id)?.name;
}

export const currentTableId = writable<number | undefined>(undefined);

export const currentTable = derived(
  [currentTableId, currentTablesData],
  ([$currentTableId, $tables]) =>
    $currentTableId === undefined
      ? undefined
      : $tables.tablesMap.get($currentTableId),
);

export function getJoinableTablesResult(tableId: number, maxDepth = 1) {
  return getAPI<JoinableTablesResult>(
    `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=${maxDepth}`,
  );
}

type TableSettings = Table['settings'];

export async function saveTableSettings(
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  settings: RecursivePartial<TableSettings>,
): Promise<void> {
  const url = `/api/db/v0/tables/${table.oid}/settings/${table.settings.id}/`;
  await patchAPI<TableSettings>(url, settings);
  await refetchTablesForSchema(table.schema);
}

export function saveRecordSummaryTemplate(
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  previewSettings: TableSettings['preview_settings'],
): Promise<void> {
  const { customized } = previewSettings;
  return saveTableSettings(table, {
    preview_settings: customized ? previewSettings : { customized },
  });
}

export function saveColumnOrder(
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  columnOrder: TableSettings['column_order'],
): Promise<void> {
  return saveTableSettings(table, {
    // Using the Set constructor to remove potential duplicates
    column_order: [...new Set(columnOrder)],
  });
}
