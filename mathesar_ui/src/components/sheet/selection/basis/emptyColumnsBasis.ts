import { ImmutableSet } from '@mathesar-component-library';

import { getColumnOffset } from '../Direction';

import type Basis from './Basis';
import { emptyBasis } from './emptyBasis';

export function basisFromEmptyColumns(columnIds: Iterable<string>): Basis {
  return {
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(columnIds),
    rowIds: new ImmutableSet(),
    pasteOperation: 'none',

    getFullySelectedColumnIds() {
      return this.columnIds;
    },

    adaptToModifiedPlane({ newPlane }) {
      if (newPlane.hasResultRows) return emptyBasis();
      const minColumnId = newPlane.columnIds.min(this.columnIds);
      const maxColumnId = newPlane.columnIds.max(this.columnIds);
      const newColumnIds =
        minColumnId === undefined || maxColumnId === undefined
          ? []
          : newPlane.columnIds.range(minColumnId, maxColumnId);
      return basisFromEmptyColumns(newColumnIds);
    },

    collapsedAndMoved(direction, plane) {
      const offset = getColumnOffset(direction);
      const newActiveColumnId = plane.columnIds.collapsedOffset(
        this.columnIds,
        offset,
      );
      if (newActiveColumnId === undefined) {
        // If we couldn't shift in the direction, then do nothing
        return this;
      }
      return basisFromEmptyColumns([newActiveColumnId]);
    },
  };
}

export function basisFromZeroEmptyColumns(): Basis {
  return basisFromEmptyColumns([]);
}
