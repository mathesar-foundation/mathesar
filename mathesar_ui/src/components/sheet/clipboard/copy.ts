import type { AbstractTypeCategoryIdentifier } from '@mathesar/stores/abstract-types/types';
import type { RecordSummariesForSheet } from '@mathesar/stores/table-data';
import type { ReadableMapLike } from '@mathesar/typeUtils';

import type SheetSelection from '../selection/SheetSelection';

import type { StructuredCell } from './StructuredCell';
import { serializeTsv } from './tsv';

/**
 * A column which allows the cells in it to be copied.
 */
interface CopyableColumn {
  abstractType: { identifier: AbstractTypeCategoryIdentifier };
  formatCellValue: (
    cellValue: unknown,
    recordSummaries?: RecordSummariesForSheet,
  ) => string | null | undefined;
}

/**
 * This is the stuff we need to know from the sheet in order to copy the content
 * of cells to the clipboard.
 */
export interface CopyingContext {
  /** Keys are row ids, values are records */
  getRows: () => Map<string, Record<string, unknown>>;
  getColumns: () => ReadableMapLike<string, CopyableColumn>;
  getRecordSummaries: () => RecordSummariesForSheet;
}

function getFormattedCellValue(
  rawCellValue: unknown,
  columns: ReadableMapLike<string, CopyableColumn>,
  columnId: string,
  recordSummaries: RecordSummariesForSheet,
): string {
  if (rawCellValue === undefined || rawCellValue === null) {
    return '';
  }
  const processedColumn = columns.get(columnId);
  if (!processedColumn) {
    return String(rawCellValue);
  }
  const formattedValue = processedColumn.formatCellValue(
    rawCellValue,
    recordSummaries,
  );
  if (formattedValue === undefined || formattedValue === null) {
    return '';
  }
  return formattedValue;
}

export function getCopyContent(
  selection: SheetSelection,
  context: CopyingContext,
) {
  const tsvRows: string[][] = [];
  const structuredRows: StructuredCell[][] = [];
  for (const rowId of selection.rowIds) {
    const tsvRow: string[] = [];
    const structuredRow: StructuredCell[] = [];
    const rows = context.getRows();
    const row = rows.get(rowId);
    if (!row) {
      // If this happens, it's a bug. Fail loudly so we don't put incorrect data
      // into the clipboard.
      throw new Error('Row not found');
    }
    const columns = context.getColumns();
    const recordSummaries = context.getRecordSummaries();
    for (const columnId of selection.columnIds) {
      const column = columns.get(columnId);
      if (!column) {
        // If this happens, it's a bug. Fail loudly so we don't put incorrect
        // data into the clipboard.
        throw new Error('Column not found');
      }
      const rawCellValue = row[columnId];
      const formattedCellValue = getFormattedCellValue(
        rawCellValue,
        columns,
        columnId,
        recordSummaries,
      );
      const type = column.abstractType.identifier;
      structuredRow.push({
        type,
        raw: rawCellValue,
        formatted: formattedCellValue,
      });
      tsvRow.push(formattedCellValue);
    }
    tsvRows.push(tsvRow);
    structuredRows.push(structuredRow);
  }

  return {
    structured: JSON.stringify(structuredRows),
    tsv: serializeTsv(tsvRows),
    cellCount: selection.rowIds.size * selection.columnIds.size,
  };
}
