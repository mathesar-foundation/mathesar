/**
 * @file
 *
 * TODO This file should ideally be refactored, cleaned up, and made to function
 * more consistently with the rest of the codebase.
 *
 * Also, tables need to be sorted before being stored, but that sorting happens
 * in many different places. I suggest having a derived store that does the
 * sorting.
 */

import type { Readable, Writable } from 'svelte/store';
import { derived, get, readable, writable } from 'svelte/store';

import {
  CancellablePromise,
  collapse,
  type RecursivePartial,
} from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { JoinableTablesResult } from '@mathesar/api/rest/types/tables/joinable_tables';
import type {
  SplitTableRequest,
  SplitTableResponse,
} from '@mathesar/api/rest/types/tables/split_table';
import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
} from '@mathesar/api/rest/utils/requestUtils';
import type { Schema } from '@mathesar/api/rpc/schemas';
import type { Table } from '@mathesar/api/rpc/tables';
import { invalidIf } from '@mathesar/components/form';
import type { AtLeastOne } from '@mathesar/typeUtils';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';

import type { Connection } from '@mathesar/api/rpc/connections';
import { TupleMap } from '@mathesar/packages/tuple-map';
import { connectionsStore } from './databases';
import { addCountToSchemaNumTables, currentSchemaId } from './schemas';
import { api } from '@mathesar/api/rpc';

const commonData = preloadCommonData();

type TablesMap = Map<Table['oid'], Table>;

interface TablesData {
  tablesMap: TablesMap;
  requestStatus: RequestStatus;
}

function makeEmptyTablesData(): TablesData {
  return {
    tablesMap: new Map(),
    requestStatus: { state: 'success' },
  };
}

type TablesStore = Writable<TablesData>;

/** Maps [connectionId, schemaOid] to TablesStore */
const tablesStores = new TupleMap<
  [Connection['id'], Schema['oid']],
  TablesStore
>();

const tablesRequests = new TupleMap<
  [Connection['id'], Schema['oid']],
  CancellablePromise<Table[]>
>();

function sortTables(tables: Iterable<Table>): Table[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name));
}

function setTablesStore(
  connection: Pick<Connection, 'id'>,
  schema: Pick<Schema, 'oid'>,
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

  let store = tablesStores.get([connection.id, schema.oid]);
  if (!store) {
    store = writable(storeValue);
    tablesStores.set([connection.id, schema.oid], store);
  } else {
    store.set(storeValue);
  }
  return store;
}

export function removeTablesStore(
  connection: Pick<Connection, 'id'>,
  schema: Pick<Schema, 'oid'>,
): void {
  tablesStores.delete([connection.id, schema.oid]);
}

export async function refetchTablesForSchema(
  connection: Pick<Connection, 'id'>,
  schema: Pick<Schema, 'oid'>,
): Promise<TablesData | undefined> {
  const store = tablesStores.get([connection.id, schema.oid]);
  if (!store) {
    // TODO: why are we logging an error here? I would expect that we'd either
    // throw or ignore. If there's a reason for this logging, please add a code
    // comment explaining why.
    console.error(`Tables store not found.`);
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    tablesRequests.get([connection.id, schema.oid])?.cancel();

    const tablesRequest = getAPI<Table[]>(
      `/api/db/v0/tables/?schema=${schema.oid}&limit=500`,
    );
    tablesRequests.set([connection.id, schema.oid], tablesRequest);
    const tableEntries = await tablesRequest;

    const schemaTablesStore = setTablesStore(connection, schema, tableEntries);

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

function getTablesStore(
  connection: Pick<Connection, 'id'>,
  schema: Pick<Schema, 'oid'>,
): TablesStore {
  let store = tablesStores.get([connection.id, schema.oid]);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      tablesMap: new Map(),
    });
    tablesStores.set([connection.id, schema.oid], store);
    // TODO_3651: add condition for current connection as well as current schema
    if (preload && commonData.current_schema === schema.oid) {
      store = setTablesStore(connection, schema, commonData.tables ?? []);
    } else {
      void refetchTablesForSchema(connection, schema);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchTablesForSchema(connection, schema);
  }
  return store;
}

function findSchemaStoreForTable(
  tableOid: Table['oid'],
): TablesStore | undefined {
  // TODO_3651 rewrite this function
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
  connection: Connection,
  schema: Schema,
  tableOid: Table['oid'],
): CancellablePromise<Table> {
  const promise = deleteAPI<Table>(`/api/db/v0/tables/${tableOid}/`);
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        addCountToSchemaNumTables(connection, schema, -1);
        tablesStores
          .get([connection.id, schema.oid])
          ?.update((tableStoreData) => {
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

// TODO_3651: This is not actually updating metadata. Merge this function with
// patchTable below. Separate actual metadata into a different function
export function updateTableMetaData(
  connection: Pick<Connection, 'id'>,
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
  connection: Connection,
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
        addCountToSchemaNumTables(connection, schema, 1);
        tablesStores.get([connection.id, schema.oid])?.update((existing) => {
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
  connection: Pick<Connection, 'id'>,
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

export function getTableFromStoreOrApi(
  connection: Pick<Connection, 'id'>,
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
  const promise = api.tables
    .get({
      database_id: connection.id,
      table_oid: tableOid,
    })
    .run();
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((table) => {
        const store = tablesStores.get([connection.id, table.schema]);
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

export const currentTablesData = collapse(
  derived(
    [connectionsStore.currentConnection, currentSchemaId],
    ([connection, schemaOid]) =>
      !connection || !schemaOid
        ? readable(makeEmptyTablesData())
        : getTablesStore(connection, { oid: schemaOid }),
  ),
);

export const currentTablesMap = derived(
  currentTablesData,
  (tablesData) => tablesData.tablesMap,
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

async function saveTableSettings(
  connection: Pick<Connection, 'id'>,
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  settings: RecursivePartial<TableSettings>,
): Promise<void> {
  const url = `/api/db/v0/tables/${table.oid}/settings/${table.settings.id}/`;
  await patchAPI<TableSettings>(url, settings);
  await refetchTablesForSchema(connection, { oid: table.schema });
}

export function saveRecordSummaryTemplate(
  connection: Pick<Connection, 'id'>,
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  previewSettings: TableSettings['preview_settings'],
): Promise<void> {
  const { customized } = previewSettings;
  return saveTableSettings(connection, table, {
    preview_settings: customized ? previewSettings : { customized },
  });
}

export function saveColumnOrder(
  connection: Pick<Connection, 'id'>,
  table: Pick<Table, 'oid' | 'settings' | 'schema'>,
  columnOrder: TableSettings['column_order'],
): Promise<void> {
  return saveTableSettings(connection, table, {
    // Using the Set constructor to remove potential duplicates
    column_order: [...new Set(columnOrder)],
  });
}

export async function refetchTablesForCurrentSchema() {
  const connection = get(connectionsStore.currentConnection);
  const schemaOid = get(currentSchemaId);
  if (connection && schemaOid) {
    await refetchTablesForSchema(connection, { oid: schemaOid });
  }
}
