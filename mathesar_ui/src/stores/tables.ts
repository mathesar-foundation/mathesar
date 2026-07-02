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
import type {
  NewPkColumnType,
  RawTableWithMetadata,
} from '@mathesar/api/rpc/tables';
import { invalidIf } from '@mathesar/components/form';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import {
  type RpcRequest,
  batchRun,
} from '@mathesar/packages/json-rpc-client-builder';
import { getErrorMessage } from '@mathesar/utils/errors';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import {
  isTableView,
  tableRequiresImportConfirmation,
} from '@mathesar/utils/tables';
import {
  CancellablePromise,
  ImmutableMap,
  type RecursivePartial,
  collapse,
} from '@mathesar-component-library';

import {
  currentSchema,
  fetchSchemasForCurrentDatabase,
  schemas as schemasReadable,
} from './schemas';

const commonData = preloadCommonData();
const isInAuthenticatedContext = commonData.routing_context !== 'anonymous';

type TablesMap = Map<Table['oid'], Table>;

export interface TablesData {
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

type DatabaseTablesEntry = {
  tablesByOid: ImmutableMap<Table['oid'], Table>;
  statusBySchema: ImmutableMap<Schema['oid'], RequestStatus>;
};

const blankDatabaseTablesEntry = (): DatabaseTablesEntry => ({
  tablesByOid: new ImmutableMap(),
  statusBySchema: new ImmutableMap(),
});

const baseStore = writable(
  new ImmutableMap<Database['id'], DatabaseTablesEntry>(),
);

function updateDatabase(
  databaseId: Database['id'],
  mutator: (entry: DatabaseTablesEntry) => DatabaseTablesEntry,
): void {
  baseStore.update((dbMap) =>
    dbMap.with(
      databaseId,
      mutator(dbMap.get(databaseId) ?? blankDatabaseTablesEntry()),
    ),
  );
}

function setSchemaRequestStatus(
  database: Database,
  schemaOid: Schema['oid'],
  status: RequestStatus,
): void {
  updateDatabase(database.id, (entry) => ({
    ...entry,
    statusBySchema: entry.statusBySchema.with(schemaOid, status),
  }));
}

function sortTables(tables: Iterable<Table>): Table[] {
  const allTables = [...tables];
  const regularTables = allTables.filter((table) => !isTableView(table));
  const views = allTables.filter((table) => isTableView(table));

  const sort = (a: Table, b: Table) => a.name.localeCompare(b.name);
  return [...views.sort(sort), ...regularTables.sort(sort)];
}

export function tableByOid(
  databaseId: Database['id'],
  tableOid: Table['oid'],
): Table | undefined {
  return get(baseStore).get(databaseId)?.tablesByOid.get(tableOid);
}

export function tablesBySchema(
  databaseId: Database['id'],
  schemaOid: Schema['oid'],
): { tablesMap: TablesMap; requestStatus: RequestStatus } {
  const entry = get(baseStore).get(databaseId);
  const inSchema = entry
    ? [...entry.tablesByOid.values()].filter((t) => t.schema.oid === schemaOid)
    : [];
  return {
    tablesMap: new Map(sortTables(inSchema).map((t) => [t.oid, t])),
    requestStatus: entry?.statusBySchema.get(schemaOid) ?? { state: 'success' },
  };
}

const tablesStore: Readable<TablesData> = derived(
  [currentSchema, baseStore],
  ([$currentSchema]) => {
    if (!$currentSchema) return makeEmptyTablesData();
    return {
      databaseId: $currentSchema.database.id,
      schemaOid: $currentSchema.oid,
      ...tablesBySchema($currentSchema.database.id, $currentSchema.oid),
    };
  },
);

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
  updateDatabase(schema.database.id, (entry) => ({
    tablesByOid: entry.tablesByOid
      .filterValues((t) => t.schema.oid !== schema.oid)
      .withEntries(tables.map((t) => [t.oid, t])),
    statusBySchema: entry.statusBySchema.with(schema.oid, { state: 'success' }),
  }));
}

let request: CancellablePromise<RawTableWithMetadata[]>;

export async function fetchTablesForCurrentSchema() {
  request?.cancel();

  const $currentSchema = get(currentSchema);
  if (!$currentSchema) return;

  try {
    setSchemaRequestStatus($currentSchema.database, $currentSchema.oid, {
      state: 'processing',
    });
    request = api.tables
      .list_with_metadata({
        database_id: $currentSchema.database.id,
        schema_oid: $currentSchema.oid,
      })
      .run();
    setTablesStore($currentSchema, await request);
  } catch (err) {
    setSchemaRequestStatus($currentSchema.database, $currentSchema.oid, {
      state: 'failure',
      errors: [getErrorMessage(err)],
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
        updateDatabase(schema.database.id, (entry) => ({
          ...entry,
          tablesByOid: entry.tablesByOid.without(tableOid),
        }));
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
  updateDatabase(schema.database.id, (entry) => ({
    ...entry,
    tablesByOid: entry.tablesByOid.with(fullTable.oid, fullTable),
  }));
  if (get(baseStore).get(schema.database.id)?.statusBySchema.has(schema.oid)) {
    schema.setTableCount(
      tablesBySchema(schema.database.id, schema.oid).tablesMap.size,
    );
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
  await batchRun(requests);

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
    type: NewPkColumnType;
  };
}): Promise<Table> {
  const created = await api.tables
    .add({
      database_id: schema.database.id,
      schema_oid: schema.oid,
      table_name: name,
      comment: description,
      pkey_column_info: pkColumn,
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

async function resolveSchema(
  database: Database,
  schemaOid: Schema['oid'],
): Promise<Schema> {
  const find = () => {
    const $schemas = get(schemasReadable);
    return $schemas.databaseId === database.id
      ? $schemas.data.get(schemaOid)
      : undefined;
  };
  let schema = find();
  if (!schema) {
    await fetchSchemasForCurrentDatabase();
    schema = find();
  }
  if (!schema) {
    throw new Error(`Schema ${schemaOid} not found in database ${database.id}`);
  }
  return schema;
}

export function getTableFromStoreOrApi({
  database,
  tableOid,
  clearCache = false,
}: {
  database: Database;
  tableOid: Table['oid'];
  clearCache?: boolean;
}): CancellablePromise<Table> {
  if (!clearCache) {
    const cached = tableByOid(database.id, tableOid);
    if (cached) {
      return new CancellablePromise((resolve) => resolve(cached));
    }
  }

  const promise = api.tables
    .get_with_metadata({
      database_id: database.id,
      table_oid: tableOid,
    })
    .run();

  return new CancellablePromise(
    (resolve, reject) => {
      void promise
        .then(async (rawTableWithMetadata) => {
          const schema = await resolveSchema(
            database,
            rawTableWithMetadata.schema,
          );
          return resolve(putTableInStore({ schema, rawTableWithMetadata }));
        })
        .catch(reject);
    },
    () => {
      promise.cancel();
    },
  );
}

let preload = true;

export const currentTablesData = collapse(
  derived(currentSchema, ($currentSchema) => {
    if (!$currentSchema) return tablesStore;
    const status = get(baseStore)
      .get($currentSchema.database.id)
      ?.statusBySchema.get($currentSchema.oid);
    if (!status) {
      if (
        preload &&
        isInAuthenticatedContext &&
        commonData.current_schema === $currentSchema.oid &&
        commonData.current_database === $currentSchema.database.id
      ) {
        if (commonData.tables.state === 'success') {
          setTablesStore($currentSchema, commonData.tables.data);
        } else {
          setSchemaRequestStatus($currentSchema.database, $currentSchema.oid, {
            state: 'failure',
            errors: [getErrorMessage(commonData.tables.error)],
          });
        }
      } else {
        void fetchTablesForCurrentSchema();
      }
      preload = false;
    } else if (status.state === 'failure') {
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
  const otherTableNames = derived(tablesStore, () => {
    const { tablesMap } = tablesBySchema(
      table.schema.database.id,
      table.schema.oid,
    );
    return new Set(
      execPipe(
        tablesMap.values(),
        filter((t) => t.oid !== table.oid),
        map((t) => t.name),
      ),
    );
  });

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
