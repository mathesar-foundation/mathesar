import * as Papa from 'papaparse';
import { get } from 'svelte/store';

import SheetSelection, {
  isCellSelected,
} from '@mathesar/components/sheet/SheetSelection';
import type { AbstractTypeCategoryIdentifier } from '@mathesar/stores/abstract-types/types';
import type { ClipboardHandler } from '@mathesar/stores/clipboard';
import type {
  ProcessedColumn,
  RecordRow,
  RecordSummariesForSheet,
} from '@mathesar/stores/table-data';
import type { QueryRow } from '@mathesar/systems/data-explorer/QueryRunner';
import type { ProcessedQueryOutputColumn } from '@mathesar/systems/data-explorer/utils';
import type { ReadableMapLike } from '@mathesar/typeUtils';
import { labeledCount } from '@mathesar/utils/languageUtils';
import { ImmutableSet, type MakeToast } from '@mathesar-component-library';

const MIME_PLAIN_TEXT = 'text/plain';
const MIME_MATHESAR_SHEET_CLIPBOARD =
  'application/x-vnd.mathesar-sheet-clipboard';

/** Keys are row ids, values are records */
type IndexedRecords = Map<number, Record<string, unknown>>;

function getRawCellValue<
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
>(
  indexedRecords: IndexedRecords,
  rowId: number,
  columnId: Column['id'],
): unknown {
  return indexedRecords.get(rowId)?.[String(columnId)];
}

function getFormattedCellValue<
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
>(
  rawCellValue: unknown,
  columnsMap: ReadableMapLike<Column['id'], Column>,
  columnId: Column['id'],
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

function serializeTsv(data: string[][]): string {
  return Papa.unparse(data, {
    delimiter: '\t',
    escapeFormulae: /^=|^\+|^@|^\t|^\r/,
  });
}

export interface SheetClipboardStats {
  cellCount: number;
}

export interface StructuredCell {
  type: AbstractTypeCategoryIdentifier;
  raw: unknown;
  formatted: string;
}

interface SheetClipboardHandlerDeps<
  Row extends QueryRow | RecordRow,
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
> {
  selection: SheetSelection<Row, Column>;
  toast: MakeToast;
  getRows(): Row[];
  getColumnsMap(): ReadableMapLike<Column['id'], Column>;
  getRecordSummaries(): RecordSummariesForSheet;
}

export class SheetClipboardHandler<
  Row extends QueryRow | RecordRow,
  Column extends ProcessedQueryOutputColumn | ProcessedColumn,
> implements ClipboardHandler
{
  private readonly deps: SheetClipboardHandlerDeps<Row, Column>;

  constructor(deps: SheetClipboardHandlerDeps<Row, Column>) {
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

  private getCopyContent(): { structured: string; tsv: string } {
    const cells = get(this.deps.selection.selectedCells);
    const indexedRecords = new Map(
      this.deps.getRows().map((r) => [r.rowIndex, r.record]),
    );
    const columns = this.deps.getColumnsMap();
    const recordSummaries = this.deps.getRecordSummaries();

    const tsvRows: string[][] = [];
    const structuredRows: StructuredCell[][] = [];
    for (const rowId of this.getRowIds(cells)) {
      const tsvRow: string[] = [];
      const structuredRow: StructuredCell[] = [];
      for (const columnId of this.getColumnIds(cells)) {
        const column = columns.get(columnId);
        if (!isCellSelected(cells, { rowIndex: rowId }, { id: columnId })) {
          // Ignore cells that are not selected.
          continue;
        }
        if (!column) {
          // Ignore cells with no associated column. This should never happen.
          continue;
        }
        const rawCellValue = getRawCellValue(indexedRecords, rowId, columnId);
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
    this.deps.toast.info(`Copied ${labeledCount(cells.size, 'cells')}.`);
    return {
      structured: JSON.stringify(structuredRows),
      tsv: serializeTsv(tsvRows),
    };
  }

  handleCopy(event: ClipboardEvent): void {
    if (event.clipboardData == null) {
      return;
    }
    const content = this.getCopyContent();
    event.clipboardData.setData(MIME_PLAIN_TEXT, content.tsv);
    event.clipboardData.setData(
      MIME_MATHESAR_SHEET_CLIPBOARD,
      content.structured,
    );
  }
}
