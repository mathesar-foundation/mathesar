import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export type TableLink = {
  table: { oid: number; name: string };
  column: { name: string };
};

export function* getLinksInThisTable(
  joinableTablesResult: JoinableTablesResult,
  currentTableColumns: Map<number, ProcessedColumn>,
): Generator<TableLink> {
  const joinableTables = joinableTablesResult.joinable_tables;
  const linkedTables = joinableTables.filter((t) => !t.fkey_path[0][1]);
  for (const joinableTable of linkedTables) {
    const table = joinableTablesResult.target_table_info[joinableTable.target];
    const columnId = joinableTable.join_path[0][0][1];
    const column = currentTableColumns.get(columnId);
    if (column) {
      yield {
        table: { oid: joinableTable.target, name: table.name },
        column: { name: column.column.name },
      };
    }
  }
}

export function* getLinksToThisTable(
  joinableTablesResult: JoinableTablesResult,
): Generator<TableLink> {
  const joinableTables = joinableTablesResult.joinable_tables;
  const linkedTables = joinableTables.filter((t) => t.fkey_path[0][1]);
  for (const joinableTable of linkedTables) {
    const table = joinableTablesResult.target_table_info[joinableTable.target];
    const columnId = joinableTable.join_path[0][1][1];
    yield {
      table: { oid: joinableTable.target, name: table.name },
      column: table.columns[columnId],
    };
  }
}
