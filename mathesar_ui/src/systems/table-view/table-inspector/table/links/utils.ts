import type {
  JoinableTable,
  JoinableTablesResult,
} from '@mathesar/api/tables/joinable_tables';
import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

export type TableLinkType = 'in_this_table' | 'from_other_tables';
export type TableLink = {
  table: { id: number; name: string };
  column: { id: number; name: string };
};

function generateTableLinkFromJoinableTable(
  linkedTable: JoinableTable,
  joinableTablesResult: JoinableTablesResult,
): TableLink {
  const isLinkReversed = linkedTable.fk_path[0][1];
  const columnId = isLinkReversed
    ? linkedTable.jp_path[0][1]
    : linkedTable.jp_path[0][0];
  console.log({ columnId });
  return {
    table: {
      id: linkedTable.target,
      name: joinableTablesResult.tables[linkedTable.target].name,
    },
    column: {
      id: columnId,
      name: joinableTablesResult.columns[columnId].name,
    },
  };
}

export function getTableLinks(
  type: TableLinkType,
  joinableTablesResult: JoinableTablesResult,
): TableLink[] {
  switch (type) {
    case 'in_this_table': {
      const linkedTables = joinableTablesResult.joinable_tables.filter(
        (table) => !table.fk_path[0][1],
      );
      const links: TableLink[] = linkedTables.map((table) =>
        generateTableLinkFromJoinableTable(table, joinableTablesResult),
      );
      return links;
    }
    case 'from_other_tables': {
      const linkedTables = joinableTablesResult.joinable_tables.filter(
        (table) => table.fk_path[0][1],
      );
      const links: TableLink[] = linkedTables.map((table) =>
        generateTableLinkFromJoinableTable(table, joinableTablesResult),
      );
      return links;
    }
    default:
      throw new MissingExhaustiveConditionError(type);
  }
}
