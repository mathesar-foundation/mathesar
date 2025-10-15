import { first } from 'iter-tools';

import { ImmutableSet } from '@mathesar-component-library';

import { parseCellId } from '../../cellIds';

import type Basis from './Basis';
import { emptyBasis } from './emptyBasis';

/**
 * This is used when the user is selecting a cell in the placeholder row. This
 * is a special case because we don't want to allow the user to select multiple
 * cells in the placeholder row, and we also don't want to allow selections that
 * include cells in data rows _and_ the placeholder row.
 */
export function basisFromPlaceholderCell(activeCellId: string): Basis {
  return {
    activeCellId,
    cellIds: new ImmutableSet([activeCellId]),
    columnIds: new ImmutableSet([parseCellId(activeCellId).columnId]),
    rowIds: new ImmutableSet(),
    pasteOperation: 'insert',
    getFullySelectedColumnIds: () => new ImmutableSet(),

    adaptToModifiedPlane({ oldPlane, newPlane }) {
      const columnId = first(this.columnIds);
      if (columnId === undefined) return emptyBasis();
      const newPlaneHasSelectedCell =
        newPlane.columnIds.has(columnId) &&
        newPlane.placeholderRowId === oldPlane.placeholderRowId;
      if (newPlaneHasSelectedCell) {
        // If we can retain the selected placeholder cell, then do so.
        return basisFromPlaceholderCell(columnId);
      }
      // Otherwise, return an empty basis
      return emptyBasis();
    },
  };
}
