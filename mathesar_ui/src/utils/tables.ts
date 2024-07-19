import type { Table } from '@mathesar/api/rpc/tables';
import {
  getImportPreviewPageUrl,
  getTablePageUrl,
} from '@mathesar/routes/urls';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import { filter } from 'iter-tools';

interface TableWithColumnOrder {
  metadata?: {
    column_order: number[] | null;
  } | null;
}

interface TableWithImportVerification {
  metadata?: {
    import_verified: boolean | null;
  } | null;
}

export function tableRequiresImportConfirmation(
  table: TableWithImportVerification,
): boolean {
  if (table.metadata?.import_verified === false) {
    return true;
  }
  return false;
}

function getColumnOrder(
  processedColumns: ProcessedColumn[],
  table: TableWithColumnOrder,
): number[] {
  /**
   * The column ids set in metadata. Because this array comes from
   * loosely-coupled metadata, it might contain ids of columns which no longer
   * exist, and it might lack ids of columns that do exist.
   */
  const orderedIds = new Set(table.metadata?.column_order ?? []);
  const existingIds = new Set(processedColumns.map((c) => c.id));

  const orderedIdsThatExist = filter((i) => existingIds.has(i), orderedIds);
  const existingIdsNotOrdered = filter((i) => !orderedIds.has(i), existingIds);

  return [...orderedIdsThatExist, ...existingIdsNotOrdered];
}

export function orderProcessedColumns(
  processedColumns: Map<number, ProcessedColumn>,
  table: TableWithColumnOrder,
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
  table: TableWithImportVerification & { oid: Table['oid'] },
) {
  if (tableRequiresImportConfirmation(table)) {
    return getImportPreviewPageUrl(connectionId, schemaId, table.oid, {
      useColumnTypeInference: true,
    });
  }
  return getTablePageUrl(connectionId, schemaId, table.oid);
}
