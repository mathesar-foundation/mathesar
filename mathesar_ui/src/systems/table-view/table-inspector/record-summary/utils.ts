import { filter, first } from 'iter-tools';

import type { ResultValue } from '@mathesar/api/rpc/records';
import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
import { parseCellId } from '@mathesar/components/sheet/cellIds';
import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
import type {
  ProcessedColumn,
  ProcessedColumns,
  RecordRow,
} from '@mathesar/stores/table-data';
import { defined } from '@mathesar-component-library';

/**
 * 'table' - We're editing the record summary template directly for the table
 * we're viewing.
 *
 * 'fk-column' - We're editing the record summary template for the table linked
 * from a foreign key column within the table we're viewing.
 */
export type RecordSummaryTemplateEditingContext = 'table' | 'fk-column';

export function getTableRecordId(p: {
  processedColumns: ProcessedColumns;
  selection: SheetSelection;
  selectableRowsMap: Map<string, RecordRow>;
}): ResultValue | undefined {
  const pk = [...p.processedColumns.values()].find((c) => c.column.primary_key);
  if (!pk) return undefined;
  const rowId = defined(p.selection.activeCellId, (c) => parseCellId(c).rowId);
  const row =
    defined(rowId, (r) => p.selectableRowsMap.get(r)) ??
    first(p.selectableRowsMap.values());
  return row?.record[pk.id];
}

export function makeNewCustomTemplate(
  columns: ProcessedColumns,
): RecordSummaryTemplate {
  const textColumns = filter(
    (c) => c.abstractType.identifier === 'text',
    columns.values(),
  );
  const firstTextColumn = first(textColumns);
  if (firstTextColumn) {
    return [[firstTextColumn.id]];
  }
  // Type assertion here because we know that every table has at least one
  // column.
  const firstColumn = first(columns.values()) as ProcessedColumn;
  return [[firstColumn.id]];
}
