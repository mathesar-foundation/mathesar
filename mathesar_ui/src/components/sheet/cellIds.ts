import { map } from 'iter-tools';

import { cartesianProduct } from '@mathesar/utils/iterUtils';

/**
 * ⚠️ Note: we have `cellId` and `cellKey` which are different.
 *
 * See notes in `records.ts.README.md`.
 */
export function makeCellId(rowId: string, columnId: string): string {
  return JSON.stringify([rowId, columnId]);
}

export function parseCellId(cellId: string): {
  rowId: string;
  columnId: string;
} {
  try {
    const [rowId, columnId] = JSON.parse(cellId) as unknown[];
    if (typeof rowId !== 'string' || typeof columnId !== 'string') {
      throw new Error();
    }
    return { rowId, columnId };
  } catch {
    throw new Error(`Unable to parse cell id: ${cellId}.`);
  }
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
