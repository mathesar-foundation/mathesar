import { arrayFrom, cycle, execPipe, first, map, take, zip } from 'iter-tools';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { Column } from '@mathesar/api/rpc/columns';
import type { ResultValue } from '@mathesar/api/rpc/records';
import type { RecordRow, RecordsData } from '@mathesar/stores/table-data';
import { getRowSelectionId } from '@mathesar/stores/table-data/records';
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
  row: RecordRow;
  recordId: ResultValue;
}

/**
 * This is the stuff we need to have from the Sheet in order to paste into it
 */
export interface PastingContext {
  getSheetColumns: () => Column[];
  getRecordRows: () => RecordRow[];
  setSelection: (selection: SheetSelection) => void;
  confirm: (message: string) => Promise<boolean>;
  updateRecords: (
    rowBlueprints: Parameters<RecordsData['bulkUpdate']>[0],
  ) => Promise<void>;
}

interface TsvCell {
  type: 'tsv';
  value: string;
}

/** Data that was copied from Mathesar */
interface MathesarCell {
  type: 'mathesar';
  value: StructuredCell;
}

type PayloadCell = TsvCell | MathesarCell;

type Payload = PayloadCell[][];

function getPayload(clipboardData: DataTransfer): Payload {
  const mathesarData = clipboardData.getData(MIME_MATHESAR_SHEET_CLIPBOARD);
  if (mathesarData) {
    const rows = validateStructuredCellRows(JSON.parse(mathesarData));
    if (rows.length === 0) throw new Error(get(_)('paste_error_empty'));
    return rows.map((row) => row.map((value) => ({ type: 'mathesar', value })));
  }

  const textData = clipboardData.getData(MIME_PLAIN_TEXT);
  if (textData) {
    const rows = deserializeTsv(textData);
    if (rows.length === 0) throw new Error(get(_)('paste_error_empty'));
    // return makeTsvPayload(rows);
    return rows.map((row) => row.map((value) => ({ type: 'tsv', value })));
  }

  throw new Error(get(_)('paste_error_unsupported_mime_type'));
}

/** Gets the subset of sheet columns that we're actually pasting into */
function getDestinationColumns(
  payloadColumnCount: number,
  selectedColumnIds: ImmutableSet<string>,
  sheetColumns: Column[],
): Column[] {
  const selectedColumnCount = selectedColumnIds.size;

  if (selectedColumnCount > payloadColumnCount) {
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
  const lastIndex = firstIndex + payloadColumnCount - 1;
  if (lastIndex >= sheetColumns.length) {
    throw new Error(get(_)('paste_error_too_few_destination_columns'));
  }

  return sheetColumns.slice(firstIndex, lastIndex + 1);
}

function getRowRef(row: RecordRow, pkColumnId: number): RowRef {
  const recordId = row.record[pkColumnId];
  return { row, recordId };
}

function insertViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  throw new Error('Insert via paste is not yet implemented.');
}

function prepareStructuredCellValue(column: Column, cell: PayloadCell) {
  if (cell.type === 'tsv') {
    // Since TSV doesn't have a mechanism to faithfully represent NULLs, we
    // assume that empty strings are NULLs.
    if (cell.value === '' && column.nullable) return null;

    return cell.value;
  }

  if (cell.type === 'mathesar') {
    // We need to check for NULL first because the "formatted" value of a copied
    // null cell will be an empty string, which we don't want to return.
    if (cell.value.raw === null) return null;

    // If we're pasting into a text column, use the formatted value.
    if (column.type === 'text') return cell.value.formatted;

    // Otherwise use the raw value
    return cell.value.raw;
  }

  return assertExhaustive(cell);
}

function makeCellBlueprint([cell, column]: [PayloadCell, Column]) {
  return {
    columnId: String(column.id),
    value: prepareStructuredCellValue(column, cell),
  };
}

async function updateViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  const targetRowCount = Math.max(selection.rowIds.size, payload.length);
  const sourceRows = [...take(targetRowCount, cycle(payload))];
  const firstSourceRow = first(sourceRows);
  if (!firstSourceRow) throw new Error(get(_)('paste_error_no_rows'));

  const sourceColumnCount = firstSourceRow.length;
  const sheetColumns = context.getSheetColumns();
  const pkColumnId = sheetColumns.find((c) => c.primary_key)?.id;
  if (!pkColumnId) throw new Error(get(_)('paste_error_no_primary_key'));

  const destinationRows = execPipe(
    context.getRecordRows(),
    (i) => startingFrom(i, (r) => selection.rowIds.has(getRowSelectionId(r))),
    map((recordRow) => getRowRef(recordRow, pkColumnId)),
    take(sourceRows.length),
    arrayFrom,
  );

  if (destinationRows.length < sourceRows.length) {
    throw new Error(get(_)('paste_error_too_few_destination_rows'));
  }

  const destinationColumns = getDestinationColumns(
    sourceColumnCount,
    selection.columnIds,
    sheetColumns,
  );

  const rowBlueprints = execPipe(
    zip(sourceRows, destinationRows),
    map(([sourceRow, destinationRow]) => ({
      recordId: destinationRow.recordId,
      cells: [...map(makeCellBlueprint, zip(sourceRow, destinationColumns))],
    })),
    arrayFrom,
  );

  const totalCellCount = destinationRows.length * destinationColumns.length;
  const confirmed = await context.confirm(
    get(_)('paste_confirmation', { values: { count: totalCellCount } }),
  );
  if (!confirmed) return;

  await context.updateRecords(rowBlueprints);

  context.setSelection(
    selection.ofRowColumnIntersection(
      destinationRows.map(({ row }) => getRowSelectionId(row)),
      destinationColumns.map((column) => String(column.id)),
    ),
  );
}

export async function paste(
  clipboardData: DataTransfer,
  selection: SheetSelection,
  context: PastingContext,
): Promise<void> {
  const payload = getPayload(clipboardData);

  const operation = selection.pasteOperation;
  if (operation === 'none') return;
  if (operation === 'insert') {
    insertViaPaste(payload, selection, context);
    return;
  }
  if (operation === 'update') {
    await updateViaPaste(payload, selection, context);
    return;
  }
  assertExhaustive(operation);
}
