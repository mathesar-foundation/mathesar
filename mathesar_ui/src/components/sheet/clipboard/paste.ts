import { arrayFrom, cycle, execPipe, first, map, take, zip } from 'iter-tools';
import { type Writable, get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import { type RecordRow, getRowSelectionId } from '@mathesar/stores/table-data';
import type {
  RowAdditionRecipe,
  RowModificationRecipe,
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

/**
 * This is the stuff we need to have from the Sheet in order to paste into it
 */
export interface PastingContext {
  getSheetColumns: () => RawColumnWithMetadata[];
  getRecordRows: () => RecordRow[];
  confirm: (message: string) => Promise<boolean>;
  bulkDml: (
    modificationRecipes: RowModificationRecipe[],
    additionRecipes?: RowAdditionRecipe[],
  ) => Promise<{ rowIds: string[]; columnIds: string[] }>;
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
  sheetColumns: RawColumnWithMetadata[],
): RawColumnWithMetadata[] {
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

function prepareStructuredCellValue(
  column: RawColumnWithMetadata,
  cell: PayloadCell,
) {
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

function makeCellBlueprint([cell, column]: [
  PayloadCell,
  RawColumnWithMetadata,
]) {
  return {
    columnId: String(column.id),
    value: prepareStructuredCellValue(column, cell),
  };
}

async function updateViaPaste({
  payload,
  selectionStore,
  context,
  confirm,
}: {
  payload: Payload;
  selectionStore: Writable<SheetSelection>;
  context: PastingContext;
  confirm: boolean;
}) {
  const initialSelection = get(selectionStore);

  const targetRowCount = Math.max(initialSelection.rowIds.size, payload.length);
  const sourceRows = [...take(targetRowCount, cycle(payload))];
  const firstSourceRow = first(sourceRows);
  if (!firstSourceRow) throw new Error(get(_)('paste_error_no_rows'));

  const sourceColumnCount = firstSourceRow.length;
  const sheetColumns = context.getSheetColumns();

  const destinationRows = execPipe(
    context.getRecordRows(),
    (i) =>
      startingFrom(i, (r) => initialSelection.rowIds.has(getRowSelectionId(r))),
    take(sourceRows.length),
    arrayFrom,
  );

  /**
   * Rows from the source data which align with existing rows in the sheet (to
   * be modified).
   */
  const sourceModificationRows = sourceRows.slice(0, destinationRows.length);

  /**
   * Rows from the source data which extend beyond the sheet (and thus will be
   * inserted).
   */
  const sourceAdditionRows = sourceRows.slice(destinationRows.length);

  const destinationColumns = getDestinationColumns(
    sourceColumnCount,
    initialSelection.columnIds,
    sheetColumns,
  );

  const modificationRecipes = execPipe(
    zip(sourceModificationRows, destinationRows),
    map(([sourceRow, destinationRow]) => ({
      row: destinationRow,
      cells: [...map(makeCellBlueprint, zip(sourceRow, destinationColumns))],
    })),
    arrayFrom,
  );

  const additionRecipes = execPipe(
    sourceAdditionRows,
    map((sourceRow) => ({
      cells: [...map(makeCellBlueprint, zip(sourceRow, destinationColumns))],
    })),
    arrayFrom,
  );

  const rowCount = Math.max(sourceRows.length, destinationRows.length);
  const columnCount = destinationColumns.length;
  const totalCellCount = rowCount * columnCount;
  if (confirm) {
    const confirmed = await context.confirm(
      get(_)('paste_confirmation', { values: { count: totalCellCount } }),
    );
    if (!confirmed) return;
  }

  const { rowIds, columnIds } = await context.bulkDml(
    modificationRecipes,
    additionRecipes,
  );

  // Note: When we call `context.bulkDml` the selection store might end up
  // getting updated. This happens if rows are inserted (because a new Plane
  // will be derived, hence updating the selection store). We update it again
  // here, and it's important to keep in mind that the `selection` value below
  // could be different from the `initialSelection` value above.
  selectionStore.update((selection) =>
    selection.ofRowColumnIntersection(rowIds, columnIds),
  );
}

export async function paste(
  clipboardData: DataTransfer,
  selectionStore: Writable<SheetSelection>,
  context: PastingContext,
): Promise<void> {
  const payload = getPayload(clipboardData);

  const operation = get(selectionStore).pasteOperation;
  if (operation === 'none') return;
  if (operation === 'insert') {
    await updateViaPaste({ payload, selectionStore, context, confirm: false });
    return;
  }
  if (operation === 'update') {
    await updateViaPaste({ payload, selectionStore, context, confirm: true });
    return;
  }
  assertExhaustive(operation);
}
