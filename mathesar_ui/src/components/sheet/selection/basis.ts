import { first } from 'iter-tools';

import { ImmutableSet } from '@mathesar/component-library';
import { parseCellId } from '../cellIds';

/**
 * - `'dataCells'` means that the selection contains data cells. This is by far
 *   the most common type of selection basis.
 *
 * - `'emptyColumns'` is used when the sheet has no rows. In this case we still
 *   want to allow the user to select columns, so we use this basis.
 *
 * - `'placeholderCell'` is used when the user is selecting a cell in the
 *   placeholder row. This is a special case because we don't want to allow the
 *   user to select multiple cells in the placeholder row, and we also don't
 *   want to allow selections that include cells in data rows _and_ the
 *   placeholder row.
 *
 * - `'empty'` is used when no cells are selected. We try to avoid this state,
 *   but we also allow for it because it makes it easier to construct selection
 *   instances if we don't already have the full plane data.
 */
export type BasisType =
  | 'dataCells'
  | 'emptyColumns'
  | 'placeholderCell'
  | 'empty';

/**
 * This type stores data about "which cells are selected", with some redundancy
 * for efficient and consistent lookup across different kinds of selections.
 *
 * Due to the redundant nature of some properties on this type, you should be
 * sure to only instantiate Basis using the utility functions below. This will
 * ensure that the data is always valid.
 */
export interface Basis {
  readonly type: BasisType;
  readonly activeCellId: string | undefined;
  readonly cellIds: ImmutableSet<string>;
  readonly rowIds: ImmutableSet<string>;
  readonly columnIds: ImmutableSet<string>;
}

export function basisFromDataCells(
  _cellIds: Iterable<string>,
  _activeCellId?: string,
): Basis {
  const parsedCells = [..._cellIds].map(parseCellId);
  const cellIds = new ImmutableSet(_cellIds);
  const activeCellId = (() => {
    if (_activeCellId === undefined) {
      return first(_cellIds);
    }
    if (cellIds.has(_activeCellId)) {
      return _activeCellId;
    }
    return first(_cellIds);
  })();
  return {
    type: 'dataCells',
    activeCellId,
    cellIds,
    columnIds: new ImmutableSet(parsedCells.map((cellId) => cellId.columnId)),
    rowIds: new ImmutableSet(parsedCells.map((cellId) => cellId.rowId)),
  };
}

export function basisFromOneDataCell(cellId: string): Basis {
  return basisFromDataCells([cellId], cellId);
}

export function basisFromEmptyColumns(columnIds: Iterable<string>): Basis {
  return {
    type: 'emptyColumns',
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(columnIds),
    rowIds: new ImmutableSet(),
  };
}

export function basisFromZeroEmptyColumns(): Basis {
  return basisFromEmptyColumns([]);
}

export function basisFromPlaceholderCell(activeCellId: string): Basis {
  return {
    type: 'placeholderCell',
    activeCellId,
    cellIds: new ImmutableSet([activeCellId]),
    columnIds: new ImmutableSet([parseCellId(activeCellId).columnId]),
    rowIds: new ImmutableSet(),
  };
}

export function emptyBasis(): Basis {
  return {
    type: 'empty',
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(),
    rowIds: new ImmutableSet(),
  };
}
