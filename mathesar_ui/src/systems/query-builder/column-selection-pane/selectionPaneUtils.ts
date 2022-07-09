import type {
  TableEntry,
  JoinableTableResult,
} from '@mathesar/api/tables/tableList';
import type { Column } from '@mathesar/api/tables/columns';

export interface ColumnWithLink {
  id: Column['id'];
  name: Column['name'];
  type: Column['type'];
  linksTo: LinkedTable | undefined;
}

export interface LinkedTable {
  id: TableEntry['id'];
  name: TableEntry['name'];
  linkedToColumn: {
    id: Column['id'];
    name: Column['name'];
  };
  columns: ColumnWithLink[];
}

export interface ReferencedByTable extends LinkedTable {
  referencedViaColumn: {
    id: Column['id'];
    name: Column['name'];
  };
}

export function getLinkFromColumn(
  result: JoinableTableResult,
  columnId: Column['id'],
  depth: number,
): LinkedTable | undefined {
  const validLinks = result.joinable_tables.filter(
    (entry) =>
      entry.depth === depth &&
      entry.fk_path[depth - 1][1] === false &&
      entry.jp_path[depth - 1][0] === columnId,
  );
  if (validLinks.length === 0) {
    return undefined;
  }
  if (validLinks.length > 1) {
    // This scenario should never occur
    throw new Error(`Multiple links present for the same column: ${columnId}`);
  }
  const link = validLinks[0];
  const toTable = {
    id: link.target,
    name: result.tables[link.target].name,
  };
  const toColumnId = link.jp_path[depth - 1][1];
  const toColumn = {
    id: toColumnId,
    name: result.columns[toColumnId].name,
  };
  return {
    ...toTable,
    linkedToColumn: toColumn,
    columns: result.tables[link.target].columns.map((columnIdInLinkedTable) => {
      const columnInLinkedTable = result.columns[columnIdInLinkedTable];
      return {
        id: columnIdInLinkedTable,
        name: columnInLinkedTable.name,
        type: columnInLinkedTable.type,
        linksTo: getLinkFromColumn(result, columnIdInLinkedTable, depth + 1),
      };
    }),
  };
}

export function getBaseTableColumnsWithLinks(
  result: JoinableTableResult,
  baseTable: TableEntry,
): ColumnWithLink[] {
  return baseTable.columns.map((column) => ({
    id: column.id,
    name: column.name,
    type: column.type,
    linksTo: getLinkFromColumn(result, column.id, 1),
  }));
}

export function getTablesThatReferenceBaseTable(
  result: JoinableTableResult,
  baseTable: TableEntry,
): ReferencedByTable[] {
  const referenceLinks = result.joinable_tables.filter(
    (entry) => entry.depth === 1 && entry.fk_path[0][1] === true,
  );
  const references: ReferencedByTable[] = [];

  referenceLinks.forEach((reference) => {
    const tableId = reference.target;
    const table = result.tables[tableId];
    const baseTableColumnId = reference.jp_path[0][0];
    const baseTableColumn = baseTable.columns.find(
      (column) => column.id === baseTableColumnId,
    );
    const referenceTableColumnId = reference.jp_path[0][1];
    if (!baseTableColumn) {
      return;
    }
    references.push({
      id: tableId,
      name: table.name,
      referencedViaColumn: {
        id: referenceTableColumnId,
        ...result.columns[referenceTableColumnId],
      },
      linkedToColumn: baseTableColumn,
      columns: result.tables[reference.target].columns
        .filter((columnId) => columnId !== referenceTableColumnId)
        .map((columnIdInTable) => {
          const columnInTable = result.columns[columnIdInTable];
          return {
            id: columnIdInTable,
            name: columnInTable.name,
            type: columnInTable.type,
            linksTo: getLinkFromColumn(result, columnIdInTable, 2),
          };
        }),
    });
  });

  return references;
}
