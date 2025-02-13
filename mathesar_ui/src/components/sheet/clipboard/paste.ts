import { map, zip } from 'iter-tools';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { ResultValue } from '@mathesar/api/rpc/records';
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

/**
 * This is the stuff we need to have from the Sheet in order to paste into it
 */
export interface PastingContext {
  getSheetColumns: () => DestinationColumn[];
  getRecordIdsFromSelectionStart: () => Iterable<ResultValue>;
}

interface TableUpdaterBlueprint {
  tableOid: number;
  rows: RowUpdaterBlueprint[];
}

interface RowUpdaterBlueprint {
  recordId: ResultValue;
  cells: CellUpdaterBlueprint[];
}

interface CellUpdaterBlueprint {
  columnId: string;
  value: unknown;
}

export interface DestinationColumn {
  id: string;
  type: string;
  name: string;
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

export function getPayload(clipboardData: DataTransfer): Payload | undefined {
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

function getDestinationColumns(
  payloadColumnCount: number,
  selectedColumnIds: ImmutableSet<string>,
  sheetColumns: DestinationColumn[],
): DestinationColumn[] {
  if (selectedColumnIds.size > payloadColumnCount) {
    throw new Error(get(_)('paste_error_too_many_destination_columns'));
  }

  /** The index within `sheetColumns` of the first pasted column */
  const firstIndex = sheetColumns.findIndex((c) => selectedColumnIds.has(c.id));
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

function insertViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  throw new Error('Insert via paste is not yet implemented.');
}

function updateViaPaste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
) {
  if (payload.type !== 'structured') {
    // TODO: implement this branch. We probably want to propagate this branching
    // logic deeper down this function
    throw new Error('Not implemented');
  }

  const payloadRows = payload.rows;

  const sheetColumns = context.getSheetColumns();

  const destinationColumns = getDestinationColumns(
    payloadRows[0].length,
    selection.columnIds,
    sheetColumns,
  );

  const recordIds = context.getRecordIdsFromSelectionStart();

  function makeCellBlueprint([cell, column]: [
    StructuredCell,
    DestinationColumn,
  ]) {
    return {
      columnId: column.id,
      // If we're pasting into a text column, use the formatted value. Otherwise
      // use the raw value.
      value: column.type === 'text' ? cell.formatted : cell.raw,
    };
  }

  function makeRowBlueprint([recordId, row]: [ResultValue, StructuredCell[]]) {
    const cells = [...map(makeCellBlueprint, zip(row, destinationColumns))];
    return { recordId, cells };
  }

  const rowBlueprints = [...map(makeRowBlueprint, zip(recordIds, payloadRows))];

  if (rowBlueprints.length < payloadRows.length) {
    throw new Error(get(_)('paste_error_too_few_destination_rows'));
  }
}

export function paste(
  payload: Payload,
  selection: SheetSelection,
  context: PastingContext,
): void {
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
