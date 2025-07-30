import { type Readable, derived } from 'svelte/store';

import { api } from '@mathesar/api/rpc';
import type { RawConstraint } from '@mathesar/api/rpc/constraints';
import {
  type TableLink,
  getLinksInThisTable,
  getLinksToThisTable,
} from '@mathesar/api/rpc/tables';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { Schema } from '@mathesar/models/Schema';
import { Table } from '@mathesar/models/Table';
import { batchRun } from '@mathesar/packages/json-rpc-client-builder';
import AsyncStore from '@mathesar/stores/AsyncStore';
import { orderProcessedColumns } from '@mathesar/utils/tables';

import {
  ProcessedColumn,
  type ProcessedColumns,
  type ProcessedColumnsStore,
} from './processedColumns';

export interface TableStructureProps {
  schema: Schema;
  oid: Table['oid'];
}

export interface TableStructureSubstance {
  table: Table;
  processedColumns: ProcessedColumns;
  constraints: RawConstraint[];
  linksInTable: TableLink[];
  linksToTable: TableLink[];
}

function getTableStructureAsyncStore(tableProps: TableStructureProps) {
  const databaseId = tableProps.schema.database.id;
  const tableOid = tableProps.oid;
  const apiRequest = { database_id: databaseId, table_oid: tableOid };
  return new AsyncStore(() =>
    batchRun([
      api.tables.get_with_metadata(apiRequest),
      api.columns.list_with_metadata(apiRequest),
      api.constraints.list(apiRequest),
      api.tables.list_joinable({
        ...apiRequest,
        max_depth: 1,
      }),
    ]).transformResolved(
      ([
        rawTableWithMetadata,
        columns,
        constraints,
        joinableTableResult,
      ]): TableStructureSubstance => {
        const processedColumns: ProcessedColumns = orderProcessedColumns(
          new Map(
            columns.map((c, index) => [
              c.id,
              new ProcessedColumn({
                tableOid,
                column: c,
                columnIndex: index,
                constraints,
              }),
            ]),
          ),
          { metadata: rawTableWithMetadata.metadata },
        );

        return {
          table: new Table({ schema: tableProps.schema, rawTableWithMetadata }),
          processedColumns,
          constraints,
          linksInTable: Array.from(
            getLinksInThisTable(
              joinableTableResult,
              new Map(columns.map((c) => [c.id, c])),
            ),
          ),
          linksToTable: Array.from(getLinksToThisTable(joinableTableResult)),
        };
      },
    ),
  );
}

export class TableStructure {
  oid: DBObjectEntry['id'];

  processedColumns: ProcessedColumnsStore;

  table: Readable<Table | undefined>;

  isLoading: Readable<boolean>;

  private asyncStore: ReturnType<typeof getTableStructureAsyncStore>;

  constructor(props: TableStructureProps) {
    this.oid = props.oid;
    this.asyncStore = getTableStructureAsyncStore(props);
    void this.asyncStore.run();

    this.processedColumns = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.processedColumns ??
        (new Map() as ProcessedColumns),
    );
    this.isLoading = derived(
      this.asyncStore,
      (tableStructureStoreValue) => tableStructureStoreValue.isLoading,
    );
    this.table = derived(
      this.asyncStore,
      (tableStructureStoreValue) =>
        tableStructureStoreValue.resolvedValue?.table,
    );
  }

  async tick(): Promise<TableStructureSubstance | undefined> {
    const result = await this.asyncStore.tick();
    return result.resolvedValue;
  }
}
