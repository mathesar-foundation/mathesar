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

    adaptToModifiedPlane({ newPlane }) {
      if (this.activeCellId !== undefined) {
        const { rowId, columnId } = parseCellId(this.activeCellId);
        if (newPlane.rowIds.has(rowId) && newPlane.columnIds.has(columnId)) {
          // If we can retain the selected placeholder cell, then do so.
          return basisFromPlaceholderCell(this.activeCellId);
        }
      }
      // Otherwise, return an empty basis
      return emptyBasis();
    },
  };
}
