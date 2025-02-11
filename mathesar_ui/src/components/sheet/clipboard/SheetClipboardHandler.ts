import * as Papa from 'papaparse';

import type { AbstractTypeCategoryIdentifier } from '@mathesar/stores/abstract-types/types';
import type { ClipboardHandler } from '@mathesar/stores/clipboard';
import type { RecordSummariesForSheet } from '@mathesar/stores/table-data';
import type { ReadableMapLike } from '@mathesar/typeUtils';
import { getErrorMessage } from '@mathesar/utils/errors';
import { labeledCount } from '@mathesar/utils/languageUtils';
import type { ImmutableSet } from '@mathesar-component-library';

import {
  type StructuredCell,
  validateStructuredCellRows,
} from './StructuredCell';

const MIME_PLAIN_TEXT = 'text/plain';
const MIME_MATHESAR_SHEET_CLIPBOARD =
  'application/x-vnd.mathesar-sheet-clipboard';

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
interface CopyingContext {
  /** Keys are row ids, values are records */
  rowsMap: Map<string, Record<string, unknown>>;
  columnsMap: ReadableMapLike<string, CopyableColumn>;
  recordSummaries: RecordSummariesForSheet;
  selectedRowIds: ImmutableSet<string>;
  selectedColumnIds: ImmutableSet<string>;
}

/**
 * This is the stuff we need to have from the Sheet in order to paste into it
 */
// interface PastingContext {}

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

function serializeTsv(data: string[][]): string {
  return Papa.unparse(data, {
    delimiter: '\t',
    // From the [Papa Parse][1] library, `escapeFormulae` helps defend against
    // formula [injection attacks][2]. We modify the default value though
    // because it [didn't work][3] for negative numbers. We're supplying our own
    // regex that uses the default behavior plus special handling for negative
    // numbers. It doesn't escape negative numbers because they are valid. But
    // it does escape anything else that begins with a hyphen.
    //
    // [1]: https://www.papaparse.com/docs
    //
    // [2]: https://owasp.org/www-community/attacks/CSV_Injection
    //
    // [3]: https://github.com/mathesar-foundation/mathesar/issues/3576
    escapeFormulae: /^=|^\+|^@|^\t|^\r|^-(?!\d+(\.\d+)?$)/,
  });
}

interface Dependencies {
  getCopyingContext(): CopyingContext;
  showToastInfo(msg: string): void;
  showToastError(msg: string): void;
}

export class SheetClipboardHandler implements ClipboardHandler {
  private readonly deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  private getCopyContent(): { structured: string; tsv: string } {
    const context = this.deps.getCopyingContext();
    const tsvRows: string[][] = [];
    const structuredRows: StructuredCell[][] = [];
    for (const rowId of context.selectedRowIds) {
      const tsvRow: string[] = [];
      const structuredRow: StructuredCell[] = [];
      for (const columnId of context.selectedColumnIds) {
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
    const cellCount =
      context.selectedRowIds.size * context.selectedColumnIds.size;
    // TODO translate this text:
    this.deps.showToastInfo(`Copied ${labeledCount(cellCount, 'cells')}.`);
    return {
      structured: JSON.stringify(structuredRows),
      tsv: serializeTsv(tsvRows),
    };
  }

  handleCopy(event: ClipboardEvent): void {
    if (event.clipboardData == null) return;
    const content = this.getCopyContent();
    event.clipboardData.setData(MIME_PLAIN_TEXT, content.tsv);
    event.clipboardData.setData(
      MIME_MATHESAR_SHEET_CLIPBOARD,
      content.structured,
    );
  }

  handlePaste({ clipboardData }: ClipboardEvent) {
    if (clipboardData == null) return;

    const mathesarData = clipboardData.getData(MIME_MATHESAR_SHEET_CLIPBOARD);
    if (mathesarData) {
      try {
        const rows = validateStructuredCellRows(JSON.parse(mathesarData));
        this.pasteMathesarData(rows);
      } catch (e) {
        this.deps.showToastError(getErrorMessage(e));
      }
      return;
    }

    const textData = clipboardData.getData(MIME_PLAIN_TEXT);
    if (textData) {
      // TODO parse as TSV, hand off to lower-level function
    }
  }

  private pasteMathesarData(rows: StructuredCell[][]): void {
    // TODO
  }
}
