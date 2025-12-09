import { ImmutableSet } from '@mathesar-component-library';

import { parseCellId } from '../../cellIds';

import type Basis from './Basis';
import { emptyBasis } from './emptyBasis';

/**
 * This is used when the user is selecting a cell in a range-restricted column.
 * This is a special case because we don't want to allow the user to select multiple
 * cells in range-restricted columns via range selection, and we also don't
 * want to allow selections that include cells in regular columns and range-restricted
 * columns. However, range-restricted columns should still be
 * traversable via keyboard navigation.
 */
export function basisFromRangeRestrictedCell(activeCellId: string): Basis {
  const { rowId, columnId } = parseCellId(activeCellId);
  return {
    activeCellId,
    cellIds: new ImmutableSet([activeCellId]),
    columnIds: new ImmutableSet([columnId]),
    rowIds: new ImmutableSet([rowId]),
    pasteOperation: 'none',
    getFullySelectedColumnIds: () => new ImmutableSet(),

    adaptToModifiedPlane({ newPlane }) {
      const newPlaneHasSelectedCell =
        newPlane.rangeRestrictedColumnIds.has(columnId) &&
        newPlane.rowIds.has(rowId);
      if (newPlaneHasSelectedCell) {
        return basisFromRangeRestrictedCell(activeCellId);
      }
      return emptyBasis();
    },
  };
}
