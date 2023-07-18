import { first } from 'iter-tools';

import { ImmutableSet } from '@mathesar/component-library';
import { assertExhaustive } from '@mathesar/utils/typeUtils';
import { parseCellId } from '../cellIds';
import { Direction, getColumnOffset } from './Direction';
import type Plane from './Plane';

/**
 * - `'dataCells'` means that the selection contains data cells. This is by
 *   far the most common type of selection basis.
 *
 * - `'emptyColumns'` is used when the sheet has no rows. In this case we
 *   still want to allow the user to select columns, so we use this basis.
 *
 * - `'placeholderCell'` is used when the user is selecting a cell in the
 *   placeholder row. This is a special case because we don't want to allow
 *   the user to select multiple cells in the placeholder row, and we also
 *   don't want to allow selections that include cells in data rows _and_ the
 *   placeholder row.
 */
type BasisType = 'dataCells' | 'emptyColumns' | 'placeholderCell';

interface Basis {
  readonly type: BasisType;
  readonly activeCellId: string | undefined;
  readonly cellIds: ImmutableSet<string>;
  readonly rowIds: ImmutableSet<string>;
  readonly columnIds: ImmutableSet<string>;
}

function basisFromDataCells(
  cellIds: Iterable<string>,
  activeCellId?: string,
): Basis {
  const parsedCells = [...cellIds].map(parseCellId);
  return {
    type: 'dataCells',
    activeCellId: activeCellId ?? first(cellIds),
    cellIds: new ImmutableSet(cellIds),
    columnIds: new ImmutableSet(parsedCells.map((cellId) => cellId.columnId)),
    rowIds: new ImmutableSet(parsedCells.map((cellId) => cellId.rowId)),
  };
}

function basisFromEmptyColumns(columnIds: Iterable<string>): Basis {
  return {
    type: 'emptyColumns',
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(columnIds),
    rowIds: new ImmutableSet(),
  };
}

function basisFromZeroEmptyColumns(): Basis {
  return basisFromEmptyColumns([]);
}

function basisFromPlaceholderCell(activeCellId: string): Basis {
  return {
    type: 'placeholderCell',
    activeCellId,
    cellIds: new ImmutableSet([activeCellId]),
    columnIds: new ImmutableSet([parseCellId(activeCellId).columnId]),
    rowIds: new ImmutableSet(),
  };
}

export default class Selection {
  private readonly plane: Plane;

  private readonly basis: Basis;

  constructor(plane: Plane, basis: Basis) {
    this.plane = plane;
    this.basis = basis;
  }

  get activeCellId() {
    return this.basis.activeCellId;
  }

  get cellIds() {
    return this.basis.cellIds;
  }

  get rowIds() {
    return this.basis.rowIds;
  }

  get columnIds() {
    return this.basis.columnIds;
  }

  private withBasis(basis: Basis): Selection {
    return new Selection(this.plane, basis);
  }

  /**
   * @returns a new selection with all cells selected. The active cell will be
   * the cell in the first row and first column.
   */
  ofAllDataCells(): Selection {
    if (!this.plane.hasResultRows) {
      return this.withBasis(basisFromZeroEmptyColumns());
    }
    return this.withBasis(basisFromDataCells(this.plane.allDataCells()));
  }

  /**
   * @returns a new selection with the cell in the first row and first column
   * selected.
   */
  ofFirstDataCell(): Selection {
    const firstCellId = first(this.plane.allDataCells());
    if (firstCellId === undefined) {
      return this.withBasis(basisFromZeroEmptyColumns());
    }
    return this.withBasis(basisFromDataCells([firstCellId]));
  }

  /**
   * @returns a new selection with all rows selected between (and including) the
   * provided rows.
   *
   * If either of the provided rows are placeholder rows, then the last data row
   * will be used in their place. This ensures that the selection is made only
   * of data rows, and will never include the placeholder row, even if a user
   * drags to select it.
   */
  ofRowRange(rowIdA: string, rowIdB: string): Selection {
    return this.withBasis(
      basisFromDataCells(
        this.plane.dataCellsInFlexibleRowRange(rowIdA, rowIdB),
      ),
    );
  }

  /**
   * @returns a new selection of all data cells in all columns between the
   * provided columnIds, inclusive.
   */
  ofColumnRange(columnIdA: string, columnIdB: string): Selection {
    const newBasis = this.plane.hasResultRows
      ? basisFromDataCells(
          this.plane.dataCellsInColumnRange(columnIdA, columnIdB),
        )
      : basisFromEmptyColumns(this.plane.columnIds.range(columnIdA, columnIdB));
    return this.withBasis(newBasis);
  }

  /**
   * @returns a new selection formed by the rectangle between the provided
   * cells, inclusive.
   *
   * If either of the provided cells are in the placeholder row, then the cell
   * in the last data row will be used in its place. This ensures that the
   * selection is made only of data cells, and will never include cells in the
   * placeholder row, even if a user drags to select a cell in it.
   */
  ofCellRange(cellIdA: string, cellIdB: string): Selection {
    return this.withBasis(
      basisFromDataCells(
        this.plane.dataCellsInFlexibleCellRange(cellIdA, cellIdB),
      ),
    );
  }

  /**
   * @returns a new selection formed from one cell within the placeholder row.
   * Note that we do not support selections of multiple cells in the placeholder
   * row.
   */
  atPlaceholderCell(cellId: string): Selection {
    return this.withBasis(basisFromPlaceholderCell(cellId));
  }

  /**
   * @returns a new selection formed from one cell within the data rows.
   */
  atDataCell(cellId: string): Selection {
    return this.withBasis(basisFromDataCells([cellId], cellId));
  }

  /**
   * @returns a new selection that fits within the provided plane. This is
   * useful when a column is deleted, reordered, or inserted.
   */
  forNewPlane(plane: Plane): Selection {
    throw new Error('Not implemented');
  }

  /**
   * @returns a new selection formed by the rectangle between the currently
   * active cell and provided cell, inclusive.
   *
   * This operation is designed to mimic the behavior of Google Sheets when
   * shift-clicking a specific cell, or when dragging to create a new selection.
   * A new selection is created that contains all cells in a rectangle bounded
   * by the active cell (also the first cell selected when dragging) and the
   * provided cell.
   */
  drawnToCell(cellId: string): Selection {
    return this.ofCellRange(this.activeCellId ?? cellId, cellId);
  }

  /**
   * @returns a new selection formed by the cells in all the rows between the
   * active cell and the provided row, inclusive.
   */
  drawnToRow(rowId: string): Selection {
    const activeRowId = this.activeCellId
      ? parseCellId(this.activeCellId).rowId
      : rowId;
    return this.ofRowRange(activeRowId, rowId);
  }

  drawnToColumn(columnId: string): Selection {
    // TODO improve handling for empty columns

    const activeColumnId = this.activeCellId
      ? parseCellId(this.activeCellId).columnId
      : columnId;
    return this.ofColumnRange(activeColumnId, columnId);
  }

  /**
   * @returns a new selection that mimics the behavior of arrow keys in
   * spreadsheets. If the active cell can be moved in the provided direction,
   * then a new selection is created with only that one cell selected.
   */
  collapsedAndMoved(direction: Direction): Selection {
    if (this.basis.type === 'emptyColumns') {
      const offset = getColumnOffset(direction);
      const newActiveColumnId = this.plane.columnIds.collapsedOffset(
        this.basis.columnIds,
        offset,
      );
      if (newActiveColumnId === undefined) {
        // If we couldn't shift in the direction, then do nothing
        return this;
      }
      return this.withBasis(basisFromEmptyColumns([newActiveColumnId]));
    }

    if (this.activeCellId === undefined) {
      // If no cells are selected, then select the first data cell
      return this.ofFirstDataCell();
    }

    const adjacent = this.plane.getAdjacentCell(this.activeCellId, direction);

    if (adjacent.type === 'none') {
      // If we can't move anywhere, then do nothing
      return this;
    }
    if (adjacent.type === 'dataCell') {
      // Move to an adjacent data cell
      return this.atDataCell(adjacent.cellId);
    }
    if (adjacent.type === 'placeholderCell') {
      // Move to an adjacent placeholder cell
      return this.atPlaceholderCell(adjacent.cellId);
    }
    return assertExhaustive(adjacent);
  }

  /**
   * @returns a new selection with the active cell moved within the selection,
   * left to right, top to bottom.
   *
   * This is to handle the `Tab` and `Shift+Tab` keys.
   */
  withActiveCellAdvanced(direction: 'forward' | 'back' = 'forward'): Selection {
    throw new Error('Not implemented');
  }

  /**
   * @returns a new selection that is grown or shrunk to mimic the behavior of
   * Google Sheets when manipulating selections via keyboard shortcuts like
   * `Shift+Down`. The selection is deformed in the direction of the provided
   * argument. The selection is _shrunk_ if doing so will keep the active cell
   * within the selection. Otherwise, the selection is _grown_.
   *
   * Note that other spreadsheet applications have slightly different behavior
   * for Shift + arrow keys. For example, LibreOffice Calc maintains state for
   * the origin of the selection separate from the active cell. The two cells
   * may be different if the user presses `Tab` after making a selection. In
   * this case, the selection will be resized with respect to the origin, not
   * the active cell. We chose to mimic Google Sheets behavior here because it
   * is simpler.
   */
  resized(direction: Direction): Selection {
    throw new Error('Not implemented');
  }
}
