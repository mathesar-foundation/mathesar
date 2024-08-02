import type { JoinableTablesResult } from '@mathesar/api/rpc/tables';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { assertExhaustive } from '@mathesar-component-library';

export type TableLinkType = 'in_this_table' | 'from_other_tables';
export type TableLink = {
  table: { id: number; name: string };
  column: { id: number; name: string };
};

export function getTableLinks(
  type: TableLinkType,
  joinableTablesResult: JoinableTablesResult,
  currentTableColumns: Map<number, ProcessedColumn>,
): TableLink[] {
  switch (type) {
    case 'in_this_table': {
      const linkedTables = joinableTablesResult.joinable_tables.filter(
        (table) => !table.fkey_path[0][1],
      );
      const links: TableLink[] = linkedTables.map((table) => ({
        table: {
          id: table.target,
          name: joinableTablesResult.tables[table.target].name,
        },
        column: {
          id: table.join_path[0][0],
          // The joinable_tables API will not contain the columns from the current table
          name:
            currentTableColumns.get(table.join_path[0][0])?.column.name || '--',
        },
      }));
      return links;
    }
    case 'from_other_tables': {
      const linkedTables = joinableTablesResult.joinable_tables.filter(
        (table) => table.fkey_path[0][1],
      );
      const links: TableLink[] = linkedTables.map((table) => ({
        table: {
          id: table.target,
          name: joinableTablesResult.tables[table.target].name,
        },
        column: {
          id: table.join_path[0][1],
          name: joinableTablesResult.columns[table.join_path[0][1]].name,
        },
      }));
      return links;
    }
    default:
      return assertExhaustive(type);
  }
}
