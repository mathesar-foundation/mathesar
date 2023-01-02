import type { TableEntry } from '@mathesar/api/types/tables';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export function isTableImportConfirmationRequired(
  table: Partial<Pick<TableEntry, 'import_verified' | 'data_files'>>,
): boolean {
  /**
   * table.import_verified can be null when tables have been
   * manually added to the db/already present in db in which
   * case we should not ask for re-confirmation.
   */
  return (
    table.import_verified === false &&
    table.data_files !== undefined &&
    table.data_files.length > 0
  );
}

export function orderProcessedColumns(processedColumns: Map<number, ProcessedColumn>, columnOrder: number[] = [] ):Map<number, ProcessedColumn> {
  // TODO, improve by calling getColumnOrder
  const allColumns = [...processedColumns.values()];
  const orderedColumns = new Map<number, ProcessedColumn>();
  // columnOrder = columnOrder ?? [];
  columnOrder.forEach((id) => {
    const index = allColumns.map((column) => column.id).indexOf(id);
    if (index !== -1) {
      const orderColumn = allColumns.splice(index, 1)[0];
      orderedColumns.set(orderColumn.id, orderColumn);
    }
  });
  allColumns.forEach((column) => {
    orderedColumns.set(column.id, column);
  });
  return orderedColumns;
}

export function getColumnOrder(
  processedColumns: ProcessedColumn[],
  table: Partial<Pick<TableEntry, 'settings'>>
) {
  const allColumns = [...processedColumns.values()];
  let completeColumnOrder:number[] = [];
  const { settings } = table;
  if (settings) {
    const { column_order: columnOrder } = settings;
    completeColumnOrder = columnOrder;
  }

  allColumns.forEach((column) => {
    if (!completeColumnOrder.includes(column.id)) {
      completeColumnOrder.push(column.id);
    }
  });

  return completeColumnOrder;
}
