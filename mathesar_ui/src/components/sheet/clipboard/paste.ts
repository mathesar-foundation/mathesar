import { cycle, first, map, take, zip } from 'iter-tools';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { Column } from '@mathesar/api/rpc/columns';
import type { ResultValue } from '@mathesar/api/rpc/records';
import type { RecordRow, RecordsData } from '@mathesar/stores/table-data';
import {
  getRowKey,
  getRowSelectionId,
} from '@mathesar/stores/table-data/records';
import { startingFrom } from '@mathesar/utils/iterUtils';
import {
  type ImmutableSet,
  assertExhaustive,
} from '@mathesar-component-library';

import type SheetSelection from '../selection/SheetSelection';

import { MIME_MATHESAR_SHEET_CLIPBOARD, MIME_PLAIN_TEXT } from './constants';
import {
  type StructuredCell,
  validateStructuredCellRows,
} from './StructuredCell';
import { deserializeTsv } from './tsv';

interface RowRef {
  recordId: ResultValue;
  rowKey: string;
}

/**
 * This is the stuff we need to have from the Sheet in order to paste into it
 */
export interface PastingContext {
  getSheetColumns: () => Column[];
  getRecordRows: () => RecordRow[];
  updateRecords: (
    rowBlueprints: Parameters<RecordsData['bulkUpdate']>[0],
  ) => Promise<void>;
}

interface TsvPayload {
  type: 'tsv';
  rows: string[][];
}

/** Data that was copied from Mathesar */
interface MathesarPayload {
  type: 'structured';
  rows: StructuredCell[][];
}

type Payload = TsvPayload | MathesarPayload;

function getPayload(clipboardData: DataTransfer): Payload | undefined {
  const mathesarData = clipboardData.getData(MIME_MATHESAR_SHEET_CLIPBOARD);
  if (mathesarData) {
    try {
      const rows = validateStructuredCellRows(JSON.parse(mathesarData));
      if (rows.length === 0) return undefined;
      return { type: 'structured', rows };
    } catch (e) {
      // Swallow errors
    }
  }

  const textData = clipboardData.getData(MIME_PLAIN_TEXT);
  if (textData) {
    try {
      const rows = deserializeTsv(textData);
      if (rows.length === 0) return undefined;
      return { type: 'tsv', rows };
    } catch (e) {
      // Swallow errors
    }
  }

  return undefined;
}

/** Gets the subset of sheet columns that we're actually pasting into */
function getDestinationColumns(
  payloadColumnCount: number,
  selectedColumnIds: ImmutableSet<string>,
  sheetColumns: Column[],
): Column[] {
  if (selectedColumnIds.size > payloadColumnCount) {
    throw new Error(get(_)('paste_error_too_many_destination_columns'));
  }

  /** The index within `sheetColumns` of the first pasted column */
  const firstIndex = sheetColumns.findIndex((c) =>
    selectedColumnIds.has(String(c.id)),
  );
  if (firstIndex === -1) {
    throw new Error(get(_)('paste_error_no_columns_selected'));
  }

  /** The index within `sheetColumns` of the final pasted column */
  const lastIndex = firstIndex + selectedColumnIds.size - 1;
  if (lastIndex >= sheetColumns.length) {
    throw new Error(get(_)('paste_error_too_few_destination_columns'));
  }

  return sheetColumns.slice(firstIndex, lastIndex + 1);
}

function getRowRef(row: RecordRow, pkColumnId: number): RowRef {
  return {
    recordId: row.record[pkColumnId],
    rowKey: getRowKey(row, pkColumnId),
  };
}

function insertViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  throw new Error('Insert via paste is not yet implemented.');
}

function makeCellBlueprint([cell, column]: [StructuredCell, Column]) {
  return {
    columnId: String(column.id),
    // If we're pasting into a text column, use the formatted value. Otherwise
    // use the raw value.
    value: column.type === 'text' ? cell.formatted : cell.raw,
  };
}

function updateViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  if (payload.type !== 'structured') {
    // TODO: implement this branch. We probably want to propagate this branching
    // logic deeper down this function
    throw new Error('Paste TSV is not yet implemented');
  }

  const sheetRows = context.getRecordRows();
  const payloadRows = payload.rows;
  const sourceRows = take(selection.rowIds.size, cycle(payloadRows));
  const firstSourceRow = first(sourceRows);
  if (!firstSourceRow) throw new Error(get(_)('paste_error_no_rows'));

  const sheetColumns = context.getSheetColumns();
  const pkColumnId = sheetColumns.find((c) => c.primary_key)?.id;
  if (!pkColumnId) throw new Error(get(_)('paste_error_no_primary_key'));
  const sourceColumnCount = firstSourceRow.length;
  const destinationColumns = getDestinationColumns(
    sourceColumnCount,
    selection.columnIds,
    sheetColumns,
  );

  const rowsFromSelectionStart = startingFrom(sheetRows, (r) =>
    selection.rowIds.has(getRowSelectionId(r)),
  );
  const rowRefs = map((r) => getRowRef(r, pkColumnId), rowsFromSelectionStart);

  function makeRowBlueprint([{ recordId, rowKey }, row]: [
    RowRef,
    StructuredCell[],
  ]) {
    const cells = [...map(makeCellBlueprint, zip(row, destinationColumns))];
    return { recordId, rowKey, cells };
  }

  const rowBlueprints = [...map(makeRowBlueprint, zip(rowRefs, sourceRows))];

  if (rowBlueprints.length < payloadRows.length) {
    throw new Error(get(_)('paste_error_too_few_destination_rows'));
  }

  void context.updateRecords(rowBlueprints);
}

export function paste(
  clipboardData: DataTransfer,
  selection: SheetSelection,
  context: PastingContext,
): void {
  const payload = getPayload(clipboardData);
  if (!payload) return;

  const operation = selection.pasteOperation;
  if (operation === 'none') return;
  if (operation === 'insert') {
    insertViaPaste(payload, selection, context);
    return;
  }
  if (operation === 'update') {
    updateViaPaste(payload, selection, context);
    return;
  }
  assertExhaustive(operation);
}
