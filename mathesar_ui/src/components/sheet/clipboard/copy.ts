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
  rowsMap: Map<string, Record<string, unknown>>;
  columnsMap: ReadableMapLike<string, CopyableColumn>;
  recordSummaries: RecordSummariesForSheet;
}

function getFormattedCellValue(
  rawCellValue: unknown,
  columnsMap: CopyingContext['columnsMap'],
  columnId: string,
  recordSummaries: RecordSummariesForSheet,
): string {
  if (rawCellValue === undefined || rawCellValue === null) {
    return '';
  }
  const processedColumn = columnsMap.get(columnId);
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
    for (const columnId of selection.rowIds) {
      const column = context.columnsMap.get(columnId);
      if (!column) {
        // Ignore cells with no associated column. This should never happen.
        continue;
      }
      const rawCellValue = context.rowsMap.get(rowId)?.[columnId];
      const formattedCellValue = getFormattedCellValue(
        rawCellValue,
        context.columnsMap,
        columnId,
        context.recordSummaries,
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
