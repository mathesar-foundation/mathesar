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

import { execPipe, filter, map } from 'iter-tools';
import {
  type Readable,
  type Writable,
  derived,
  get,
  readable,
  writable,
} from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { ColumnPatchSpec } from '@mathesar/api/rpc/columns';
import type { RawTableWithMetadata } from '@mathesar/api/rpc/tables';
import { invalidIf } from '@mathesar/components/form';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import {
  type RpcRequest,
  batchSend,
} from '@mathesar/packages/json-rpc-client-builder';
import { TupleMap } from '@mathesar/packages/tuple-map';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import { tableRequiresImportConfirmation } from '@mathesar/utils/tables';
import {
  CancellablePromise,
  type RecursivePartial,
  collapse,
} from '@mathesar-component-library';

import { currentSchema } from './schemas';

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

/** Maps [databaseId, schemaOid] to TablesStore */
const tablesStores = new TupleMap<
  [Database['id'], Schema['oid']],
  TablesStore
>();

const tablesRequests = new TupleMap<
  [Database['id'], Schema['oid']],
  CancellablePromise<RawTableWithMetadata[]>
>();

function sortTables(tables: Iterable<Table>): Table[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name));
}

function setTablesStore(schema: Schema, tables: Table[]): TablesStore {
  const tablesMap: TablesMap = new Map();
  if (tables) {
    sortTables(tables).forEach((t) => tablesMap.set(t.oid, t));
  }

  const storeValue: TablesData = {
    tablesMap,
    requestStatus: { state: 'success' },
  };

  let store = tablesStores.get([schema.database.id, schema.oid]);
  if (!store) {
    store = writable(storeValue);
    tablesStores.set([schema.database.id, schema.oid], store);
  } else {
    store.set(storeValue);
  }
  return store;
}

export function removeTablesStore(schema: Schema): void {
  tablesStores.delete([schema.database.id, schema.oid]);
}

export async function refetchTablesForSchema(
  schema: Schema,
): Promise<TablesData | undefined> {
  const store = tablesStores.get([schema.database.id, schema.oid]);
  if (!store) {
    // TODO: why are we logging an error here? I would expect that we'd either
    // throw or ignore. If there's a reason for this logging, please add a code
    // comment explaining why.
    console.error('Tables store not found.');
    return undefined;
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      requestStatus: { state: 'processing' },
    }));

    tablesRequests.get([schema.database.id, schema.oid])?.cancel();

    const tablesRequest = api.tables
      .list_with_metadata({
        database_id: schema.database.id,
        schema_oid: schema.oid,
      })
      .run();
    tablesRequests.set([schema.database.id, schema.oid], tablesRequest);
    const tableEntries = await tablesRequest;

    const schemaTablesStore = setTablesStore(
      schema,
      tableEntries.map(
        (t) =>
          new Table({
            schema,
            rawTableWithMetadata: t,
          }),
      ),
    );

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

function getTablesStore(schema: Schema): TablesStore {
  let store = tablesStores.get([schema.database.id, schema.oid]);
  if (!store) {
    store = writable({
      requestStatus: { state: 'processing' },
      tablesMap: new Map(),
    });
    tablesStores.set([schema.database.id, schema.oid], store);
    if (
      preload &&
      commonData.current_schema === schema.oid &&
      commonData.current_database === schema.database.id
    ) {
      store = setTablesStore(
        schema,
        commonData.tables.map(
          (t) =>
            new Table({
              schema,
              rawTableWithMetadata: t,
            }),
        ),
      );
    } else {
      void refetchTablesForSchema(schema);
    }
    preload = false;
  } else if (get(store).requestStatus.state === 'failure') {
    void refetchTablesForSchema(schema);
  }
  return store;
}

export function deleteTable(
  schema: Schema,
  tableOid: Table['oid'],
): CancellablePromise<void> {
  const promise = api.tables
    .delete({
      database_id: schema.database.id,
      table_oid: tableOid,
    })
    .run();
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then(() => {
        schema.setTableCount(get(schema.tableCount) - 1);
        tablesStores
          .get([schema.database.id, schema.oid])
          ?.update((tableStoreData) => {
            tableStoreData.tablesMap.delete(tableOid);
            return {
              ...tableStoreData,
              tablesMap: new Map(tableStoreData.tablesMap),
            };
          });
        return resolve();
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

function updateTableStoreIfPresent({
  schema,
  rawTableWithMetadata,
}: {
  schema: Schema;
  rawTableWithMetadata: RawTableWithMetadata;
}): Table {
  const fullTable: Table = new Table({
    schema,
    rawTableWithMetadata,
  });
  const tablesStore = tablesStores.get([schema.database.id, schema.oid]);
  if (tablesStore) {
    tablesStore.update(({ requestStatus, tablesMap }) => {
      tablesMap.set(fullTable.oid, fullTable);
      const newTablesMap = new Map(
        sortTables(tablesMap.values()).map((t) => [t.oid, t]),
      );
      return {
        requestStatus,
        tablesMap: newTablesMap,
      };
    });
    schema.setTableCount(get(tablesStore).tablesMap.size);
  }
  return fullTable;
}

export async function updateTable({
  schema,
  table: rawPartialTable,
  columnPatchSpecs,
  columnsToDelete,
}: {
  schema: Schema;
  table: RecursivePartial<RawTableWithMetadata> & {
    oid: RawTableWithMetadata['oid'];
  };
  columnPatchSpecs?: ColumnPatchSpec[];
  columnsToDelete?: number[];
}): Promise<Table> {
  const requests: RpcRequest<void>[] = [];
  if (rawPartialTable.name || rawPartialTable.description) {
    requests.push(
      api.tables.patch({
        database_id: schema.database.id,
        table_oid: rawPartialTable.oid,
        table_data_dict: {
          name: rawPartialTable.name,
          description: rawPartialTable.description,
        },
      }),
    );
  }
  if (columnPatchSpecs) {
    requests.push(
      api.columns.patch({
        database_id: schema.database.id,
        table_oid: rawPartialTable.oid,
        column_data_list: columnPatchSpecs,
      }),
    );
  }
  if (rawPartialTable.metadata) {
    requests.push(
      api.tables.metadata.set({
        database_id: schema.database.id,
        table_oid: rawPartialTable.oid,
        metadata: rawPartialTable.metadata,
      }),
    );
  }
  if (columnsToDelete?.length) {
    requests.push(
      api.columns.delete({
        database_id: schema.database.id,
        table_oid: rawPartialTable.oid,
        column_attnums: columnsToDelete,
      }),
    );
  }
  await batchSend(requests);

  // TODO: Remove once tables.patch_with_metadata response provides RawTableWithMetadata
  const rawTableWithMetadata = await api.tables
    .get_with_metadata({
      database_id: schema.database.id,
      table_oid: rawPartialTable.oid,
    })
    .run();
  return updateTableStoreIfPresent({ schema, rawTableWithMetadata });
}

export async function createTable({
  schema,
}: {
  schema: Schema;
}): Promise<Table> {
  const created = await api.tables
    .add({
      database_id: schema.database.id,
      schema_oid: schema.oid,
    })
    .run();

  // TODO: Remove once tables.patch response provides RawTable
  const rawTableWithMetadata = await api.tables
    .get_with_metadata({
      database_id: schema.database.id,
      table_oid: created.oid,
    })
    .run();

  schema.setTableCount(get(schema.tableCount) + 1);
  return updateTableStoreIfPresent({ schema, rawTableWithMetadata });
}

export async function createTableFromDataFile(props: {
  schema: Schema;
  dataFile: Pick<DataFile, 'id'>;
  name?: string;
}): Promise<Table> {
  const { schema } = props;

  const created = await api.tables
    .import({
      database_id: schema.database.id,
      schema_oid: schema.oid,
      table_name: props.name,
      data_file_id: props.dataFile.id,
    })
    .run();

  schema.setTableCount(get(schema.tableCount) + 1);
  const fullTable = await updateTable({
    schema,
    table: {
      oid: created.oid,
      metadata: {
        import_verified: false,
        data_file_id: props.dataFile.id,
      },
    },
  });
  return fullTable;
}

export function getTableFromStoreOrApi({
  schema,
  tableOid,
}: {
  schema: Schema;
  tableOid: Table['oid'];
}): CancellablePromise<Table> {
  const tablesStore = tablesStores.get([schema.database.id, schema.oid]);
  if (tablesStore) {
    const table = get(tablesStore).tablesMap.get(tableOid);
    if (table) {
      return new CancellablePromise((resolve) => {
        resolve(table);
      });
    }
  }
  const promise = api.tables
    .get_with_metadata({
      database_id: schema.database.id,
      table_oid: tableOid,
    })
    .run();
  return new CancellablePromise(
    (resolve, reject) => {
      void promise.then((rawTableWithMetadata) => {
        const table = new Table({ schema, rawTableWithMetadata });
        const store = tablesStores.get([schema.database.id, schema.oid]);
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
  derived([currentSchema], ([schema]) =>
    !schema ? readable(makeEmptyTablesData()) : getTablesStore(schema),
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
        .filter((table) => !tableRequiresImportConfirmation(table))
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

export function factoryToGetTableNameValidationErrors(
  table: Table,
): Readable<(n: string) => string[]> {
  const tablesStore = tablesStores.get([
    table.schema.database.id,
    table.schema.oid,
  ]);
  if (!tablesStore) throw new Error('Tables store not found');

  const otherTableNames = derived(
    tablesStore,
    (d) =>
      new Set(
        execPipe(
          d.tablesMap.values(),
          filter((t) => t.oid !== table.oid),
          map((t) => t.name),
        ),
      ),
  );

  return derived([otherTableNames, _], ([$otherTableNames, $_]) => {
    function getNameValidationErrors(name: string): string[] {
      if (!name.trim()) {
        return [$_('table_name_cannot_be_empty')];
      }
      if ($otherTableNames.has(name)) {
        return [$_('table_with_name_already_exists')];
      }
      return [];
    }

    return getNameValidationErrors;
  });
}
