import { filter } from 'iter-tools';

import type { RecursivePartial } from '@mathesar/component-library';
import type { Table } from '@mathesar/models/Table';
import {
  getImportPreviewPageUrl,
  getTablePageUrl,
} from '@mathesar/routes/urls';
import type { ProcessedColumn } from '@mathesar/stores/table-data';

/** If the same value exists for `a` and `b`, the value from `b` will be used */
export function mergeTableMetadata(
  a: Table['metadata'],
  b?: RecursivePartial<Table['metadata']>,
): Table['metadata'] {
  if (!a && !b) return null;
  if (!b) return a;
  return {
    column_order: b.column_order
      ? b.column_order.map(Number)
      : a?.column_order ?? null,
    data_file_id: b.data_file_id ?? a?.data_file_id ?? null,
    import_verified: b.import_verified ?? a?.import_verified ?? null,
    record_summary_customized:
      b.record_summary_customized ?? a?.record_summary_customized ?? null,
    record_summary_template:
      b.record_summary_template ?? a?.record_summary_template ?? null,
  };
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

interface TableWithColumnOrder {
  metadata?: {
    column_order: number[] | null;
  } | null;
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
  databaseId: number,
  schemaId: number,
  table: TableWithImportVerification & { oid: Table['oid'] },
) {
  if (tableRequiresImportConfirmation(table)) {
    return getImportPreviewPageUrl(databaseId, schemaId, table.oid, {
      useColumnTypeInference: true,
    });
  }
  return getTablePageUrl(databaseId, schemaId, table.oid);
}
