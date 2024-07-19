import type { Table } from '@mathesar/api/rpc/tables';
import {
  getImportPreviewPageUrl,
  getTablePageUrl,
} from '@mathesar/routes/urls';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

export function isTableImportConfirmationRequired(
  table: Partial<Pick<Table, 'import_verified' | 'data_files'>>,
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
  table: Partial<Pick<Table, 'settings'>>,
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
  table: Partial<Pick<Table, 'settings'>>,
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

export function getLinkForTableItem(
  connectionId: number,
  schemaId: number,
  table: Pick<Table, 'oid' | 'import_verified' | 'data_files'>,
) {
  if (isTableImportConfirmationRequired(table)) {
    return getImportPreviewPageUrl(connectionId, schemaId, table.oid, {
      useColumnTypeInference: true,
    });
  }
  return getTablePageUrl(connectionId, schemaId, table.oid);
}
