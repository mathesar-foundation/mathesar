import { get } from 'svelte/store';

import { ImmutableSet } from '@mathesar/component-library';
import SheetSelection, {
  isCellSelected,
} from '@mathesar/components/sheet/SheetSelection';
import type {
  ClipboardController,
  CopyingStrategy,
} from '@mathesar/stores/clipboard';
import type {
  ProcessedColumn,
  RecordRow,
  RecordSummariesForSheet,
} from '@mathesar/stores/table-data';
import type { QueryRow } from '@mathesar/systems/data-explorer/QueryRunner';
import type { ProcessedQueryOutputColumn } from '@mathesar/systems/data-explorer/utils';
import type { ReadableMapLike } from '@mathesar/typeUtils';

/** Keys are row ids, values are records */
type IndexedRecords = Map<number, Record<string, unknown>>;

function getCellText<
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
>(
  indexedRecords: IndexedRecords,
  columnsMap: ReadableMapLike<Column['id'], Column>,
  rowId: number,
  columnId: Column['id'],
  strategy: CopyingStrategy,
  recordSummaries: RecordSummariesForSheet,
): string {
  const record = indexedRecords.get(rowId);
  if (!record) {
    return '';
  }
  const rawCellValue: unknown = record[String(columnId)];
  if (rawCellValue === undefined || rawCellValue === null) {
    return '';
  }
  const stringifiedRawCellValue = String(rawCellValue);
  if (strategy === 'raw') {
    return stringifiedRawCellValue;
  }
  const processedColumn = columnsMap.get(columnId);
  if (!processedColumn) {
    return stringifiedRawCellValue;
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

interface SheetClipboardControllerDeps<
  Row extends QueryRow | RecordRow,
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
> {
  selection: SheetSelection<Row, Column>;
  getRows(): Row[];
  getColumnsMap(): ReadableMapLike<Column['id'], Column>;
  getRecordSummaries(): RecordSummariesForSheet;
}

export class SheetClipboardController<
  Row extends QueryRow | RecordRow,
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
> implements ClipboardController
{
  private readonly deps: SheetClipboardControllerDeps<Row, Column>;

  constructor(deps: SheetClipboardControllerDeps<Row, Column>) {
    this.deps = deps;
  }

  private getColumnIds(cells: ImmutableSet<string>) {
    return this.deps.selection.getSelectedUniqueColumnsId(
      cells,
      // We don't care about the columns selected when the table is empty,
      // because we only care about cells selected that have content.
      new ImmutableSet(),
    );
  }

  private getRowIds(cells: ImmutableSet<string>) {
    return this.deps.selection.getSelectedUniqueRowsId(cells);
  }

  private getCopyContent(strategy: CopyingStrategy): string {
    const cells = get(this.deps.selection.selectedCells);
    let result = '';
    const indexedRecords = new Map(
      this.deps.getRows().map((r) => [r.rowIndex, r.record]),
    );
    const processedColumns = this.deps.getColumnsMap();
    const recordSummaries = this.deps.getRecordSummaries();
    for (const rowId of this.getRowIds(cells)) {
      for (const columnId of this.getColumnIds(cells)) {
        if (isCellSelected(cells, { rowIndex: rowId }, { id: columnId })) {
          result += getCellText(
            indexedRecords,
            processedColumns,
            rowId,
            columnId,
            strategy,
            recordSummaries,
          );
        }
        result += '\t';
      }
      result += '\n';
    }
    return result;
  }

  copy(strategy: CopyingStrategy): Promise<void> {
    return navigator.clipboard.writeText(this.getCopyContent(strategy));
  }
}
