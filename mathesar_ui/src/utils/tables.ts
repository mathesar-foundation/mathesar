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

export function getColumnOrder(
  processedColumns: ProcessedColumn[],
  table: Partial<Pick<TableEntry, 'settings'>>,
) {
  const allColumns = [...processedColumns.values()];
  let completeColumnOrder: number[] = [];
  const { settings } = table;
  if (settings) {
    const { column_order: columnOrder } = settings;
    if (columnOrder) {
      completeColumnOrder = columnOrder;
    }
  }

  allColumns.forEach((column) => {
    if (!completeColumnOrder.includes(column.id)) {
      completeColumnOrder.push(column.id);
    }
  });

  return completeColumnOrder;
}

export function orderProcessedColumns(
  processedColumns: Map<number, ProcessedColumn>,
  table: Partial<Pick<TableEntry, 'settings'>>,
): Map<number, ProcessedColumn> {
  const columns = [...processedColumns.values()];
  const orderedColumns = new Map<number, ProcessedColumn>();

  const columnOrder = getColumnOrder(columns, table);
  columnOrder.forEach((id) => {
    const index = columns.map((column) => column.id).indexOf(id);
    if (index !== -1) {
      const orderColumn = columns.splice(index, 1)[0];
      orderedColumns.set(orderColumn.id, orderColumn);
    }
  });

  return orderedColumns;
}
