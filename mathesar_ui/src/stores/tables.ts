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
import { type Readable, derived, get, writable } from 'svelte/store';
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
import { getErrorMessage } from '@mathesar/utils/errors';
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
  databaseId?: Database['id'];
  schemaOid?: Schema['oid'];
  tablesMap: TablesMap;
  requestStatus: RequestStatus;
}

function makeEmptyTablesData(): TablesData {
  return {
    tablesMap: new Map(),
    requestStatus: { state: 'success' },
  };
}

const tablesStore = writable(makeEmptyTablesData());

function sortTables(tables: Iterable<Table>): Table[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name));
}

function setTablesStore(
  schema: Schema,
  rawTablesWithMetadata: RawTableWithMetadata[],
) {
  const tables = rawTablesWithMetadata.map(
    (t) =>
      new Table({
        schema,
        rawTableWithMetadata: t,
      }),
  );

  const tablesMap: TablesMap = new Map();
  sortTables(tables).forEach((t) => tablesMap.set(t.oid, t));

  tablesStore.set({
    databaseId: schema.database.id,
    schemaOid: schema.oid,
    tablesMap,
    requestStatus: { state: 'success' },
  });
}

let request: CancellablePromise<RawTableWithMetadata[]>;

export async function fetchTablesForCurrentSchema() {
  request?.cancel();

  const $currentSchema = get(currentSchema);
  if (!$currentSchema) {
    tablesStore.set(makeEmptyTablesData());
    return;
  }

  try {
    tablesStore.update(($tablesStore) => {
      if (
        $tablesStore.databaseId === $currentSchema.database.id &&
        $tablesStore.schemaOid === $currentSchema.oid
      ) {
        return {
          ...$tablesStore,
          requestStatus: { state: 'processing' },
        };
      }
      return {
        databaseId: $currentSchema.database.id,
        schemaOid: $currentSchema.oid,
        tablesMap: new Map(),
        requestStatus: { state: 'processing' },
      };
    });

    request = api.tables
      .list_with_metadata({
        database_id: $currentSchema.database.id,
        schema_oid: $currentSchema.oid,
      })
      .run();

    const tableEntries = await request;

    setTablesStore($currentSchema, tableEntries);
  } catch (err) {
    tablesStore.update(($tablesStore) => {
      if (
        $tablesStore.databaseId === $currentSchema.database.id &&
        $tablesStore.schemaOid === $currentSchema.oid
      ) {
        return {
          ...$tablesStore,
          requestStatus: {
            state: 'failure',
            errors: [getErrorMessage(err)],
          },
        };
      }
      return {
        databaseId: $currentSchema.database.id,
        schemaOid: $currentSchema.oid,
        tablesMap: new Map(),
        requestStatus: {
          state: 'failure',
          errors: [getErrorMessage(err)],
        },
      };
    });
  }
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
        const $tablesStore = get(tablesStore);
        if (
          $tablesStore.databaseId === schema.database.id &&
          $tablesStore.schemaOid === schema.oid
        ) {
          tablesStore.update((tableStoreData) => {
            tableStoreData.tablesMap.delete(tableOid);
            return {
              ...tableStoreData,
              tablesMap: new Map(tableStoreData.tablesMap),
            };
          });
        }
        return resolve();
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

function putTableInStore({
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
  const $tablesStore = get(tablesStore);
  if (
    $tablesStore.databaseId === schema.database.id &&
    $tablesStore.schemaOid === schema.oid
  ) {
    tablesStore.update((tablesData) => {
      tablesData.tablesMap.set(fullTable.oid, fullTable);
      const newTablesMap = new Map(
        sortTables(tablesData.tablesMap.values()).map((t) => [t.oid, t]),
      );
      return {
        ...tablesData,
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
  return putTableInStore({ schema, rawTableWithMetadata });
}

export async function createTable({
  schema,
  name,
  description,
  pkColumn,
}: {
  schema: Schema;
  name?: string;
  description?: string;
  pkColumn?: {
    name: string;
    type: 'identity' | 'uuid';
  };
}): Promise<Table> {
  const created = await api.tables
    .add({
      database_id: schema.database.id,
      schema_oid: schema.oid,
      table_name: name,
      comment: description,
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
  return putTableInStore({ schema, rawTableWithMetadata });
}

export async function createTableFromDataFile(props: {
  schema: Schema;
  dataFile: Pick<DataFile, 'id'>;
  name?: string;
}): Promise<{
  table: Table;
  renamedColumns: Record<string, string>;
}> {
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
  return {
    table: fullTable,
    renamedColumns: created.renamed_columns,
  };
}

export function getTableFromStoreOrApi({
  schema,
  tableOid,
}: {
  schema: Schema;
  tableOid: Table['oid'];
}): CancellablePromise<Table> {
  const $tablesStore = get(tablesStore);

  if (
    $tablesStore.databaseId === schema.database.id &&
    $tablesStore.schemaOid === schema.oid
  ) {
    const table = $tablesStore.tablesMap.get(tableOid);
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
        const table = putTableInStore({
          schema,
          rawTableWithMetadata,
        });
        return resolve(table);
      }, reject);
    },
    () => {
      promise.cancel();
    },
  );
}

let preload = true;

export const currentTablesData = collapse(
  derived(currentSchema, ($currentSchema) => {
    const $tablesStore = get(tablesStore);
    if (
      $tablesStore.databaseId !== $currentSchema?.database.id ||
      $tablesStore.schemaOid !== $currentSchema?.oid
    ) {
      if (
        preload &&
        commonData.current_schema === $currentSchema?.oid &&
        commonData.current_database === $currentSchema?.database.id
      ) {
        if (commonData.tables.state === 'success') {
          setTablesStore($currentSchema, commonData.tables.data);
        } else {
          tablesStore.set({
            databaseId: $currentSchema.database.id,
            schemaOid: $currentSchema.oid,
            tablesMap: new Map(),
            requestStatus: {
              state: 'failure',
              errors: [getErrorMessage(commonData.tables.error)],
            },
          });
        }
      } else {
        void fetchTablesForCurrentSchema();
      }
      preload = false;
    } else if ($tablesStore.requestStatus.state === 'failure') {
      void fetchTablesForCurrentSchema();
    }
    return tablesStore;
  }),
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
