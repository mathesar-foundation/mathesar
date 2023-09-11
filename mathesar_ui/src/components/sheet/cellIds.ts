import { map } from 'iter-tools';

import { cartesianProduct } from '@mathesar/utils/iterUtils';

const CELL_ID_DELIMITER = '-';

/**
 * We can serialize a cell id this way only because we're confident that the
 * rowId will never contain the delimiter. Some columnIds _do_ contain
 * delimiters (e.g. in the Data Explorer), but that's okay because we can still
 * separate the values based on the first delimiter.
 */
export function makeCellId(rowId: string, columnId: string): string {
  return `${rowId}${CELL_ID_DELIMITER}${columnId}`;
}

export function parseCellId(cellId: string): {
  rowId: string;
  columnId: string;
} {
  const delimiterIndex = cellId.indexOf(CELL_ID_DELIMITER);
  if (delimiterIndex === -1) {
    throw new Error(`Unable to parse cell id without a delimiter: ${cellId}.`);
  }
  const rowId = cellId.slice(0, delimiterIndex);
  const columnId = cellId.slice(delimiterIndex + 1);
  return { rowId, columnId };
}

export function makeCells(
  rowIds: Iterable<string>,
  columnIds: Iterable<string>,
): Iterable<string> {
  return map(
    ([rowId, columnId]) => makeCellId(rowId, columnId),
    cartesianProduct(rowIds, columnIds),
  );
}
