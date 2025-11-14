import { filter } from 'iter-tools';

import { iconTable, iconView } from '@mathesar/icons';
import type { Table } from '@mathesar/models/Table';
import {
  getImportPreviewPageUrl,
  getTablePageUrl,
} from '@mathesar/routes/urls';
import type { ProcessedColumn } from '@mathesar/stores/table-data';
import type { IconProps } from '@mathesar-component-library/types';

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

export function isTableView(table: Pick<Table, 'type'>): boolean {
  return table.type === 'view' || table.type === 'materialized_view';
}

export function getTableIcon(table: Pick<Table, 'type'>): IconProps {
  return isTableView(table) ? iconView : iconTable;
}

export function getTableIconColor(table: Pick<Table, 'type'>): string {
  return isTableView(table) ? 'var(--color-view)' : 'var(--color-table)';
}

export function getTableAccentColor(table: Pick<Table, 'type'>): string {
  return isTableView(table) ? 'var(--color-view-80)' : 'var(--color-table-80)';
}

export function getTableIconFillColor(table: Pick<Table, 'type'>): string {
  return isTableView(table)
    ? 'linear-gradient(135deg, var(--color-view), var(--color-view-80))'
    : 'linear-gradient(135deg, var(--color-table), var(--color-table-80))';
}
