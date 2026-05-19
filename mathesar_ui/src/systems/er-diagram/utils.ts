import { api } from '@mathesar/api/rpc';
import { CancellablePromise } from '@mathesar/component-library';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import { batchRun } from '@mathesar/packages/json-rpc-client-builder';
import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';


export function getERinfo(p: {
  database: Pick<Database, 'id'>;
  baseTableId: Table['oid'];
}): CancellablePromise<JoinableTablesResult> {
  const args = {
    database_id: p.database.id,
    table_oid: p.baseTableId,
  };
  return batchRun([
    api.tables.list_joinable(args),
    api.tables.get(args),
    api.columns.list_with_metadata(args),
  ]).transformResolved(([joinableTables, baseTable, columns]) => ({
    joinableTables,
    baseTable,
    columns,
  }));
}
