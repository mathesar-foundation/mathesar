import { first } from 'iter-tools';

import { match } from '@mathesar/utils/patternMatching';
import {
  type ImmutableSet,
  assertExhaustive,
} from '@mathesar-component-library';

import { makeCellId, makeCells, parseCellId } from '../cellIds';

import {
  type Basis,
  basisFromDataCells,
  basisFromEmptyColumns,
  basisFromOneDataCell,
  basisFromPlaceholderCell,
  basisFromZeroEmptyColumns,
  emptyBasis,
} from './basis';
import type { Direction } from './Direction';
import Plane from './Plane';
import type { SheetCellDetails } from './selectionUtils';

/**
 * This is an immutable data structure which fully represents the state of a
 * selection selection of cells along with the Plane in which they were
 * selected.
 *
 * We store the Plane here so to make it possible to provide methods on
 * `SheetSelection` instances which return new mutations of the selection that
 * are still valid within the Plane.
 */
export default class SheetSelection {
  private readonly plane: Plane;

  private readonly basis: Basis;

  /** Ids of columns in which _all_ data cells are selected */
  fullySelectedColumnIds: ImmutableSet<string>;

  constructor(plane: Plane = new Plane(), basis: Basis = emptyBasis()) {
    this.plane = plane;
    this.basis = basis;
    // TODO validate that basis is valid within plane. For example, remove
    // selected cells from the basis that do not occur within the plane.

    this.fullySelectedColumnIds = this.basis.getFullySelectedColumnIds(
      this.plane,
    );
  }

  get activeCellId(): string | undefined {
    return this.basis.activeCellId;
  }

  get cellIds(): ImmutableSet<string> {
    return this.basis.cellIds;
  }

  /** Ids of rows which are at least _partially_ selected */
  get rowIds(): ImmutableSet<string> {
    return this.basis.rowIds;
  }

  /** Ids of columns which are at least _partially_ selected */
  get columnIds(): ImmutableSet<string> {
    return this.basis.columnIds;
  }

  /**
   * What operation should be performed when pasting data into the selected
   * cells.
   */
  get pasteOperation() {
    return this.basis.pasteOperation;
  }

  private withBasis(basis: Basis): SheetSelection {
    return new SheetSelection(this.plane, basis);
  }

  /**
   * @returns a new selection with all cells selected. The active cell will be
   * the cell in the first row and first column.
   */
  ofAllDataCells(): SheetSelection {
    if (!this.plane.hasResultRows) {
      return this.withBasis(basisFromZeroEmptyColumns());
    }
    return this.withBasis(basisFromDataCells(this.plane.allDataCells()));
  }

  /**
   * @returns a new selection with the cell in the first row and first column
   * selected.
   */
  ofFirstDataCell(): SheetSelection {
    const firstCellId = first(this.plane.allDataCells());
    if (firstCellId === undefined) {
      return this.withBasis(basisFromZeroEmptyColumns());
    }
    return this.withBasis(basisFromDataCells([firstCellId]));
  }

  /**
   * @returns a new selection formed by selecting the one cell that we think
   * users are most likely to want selected after choosing to add a new record.
   *
   * We use the last row because that's where we add new records. If there is
   * only one column, then we select the first cell in that column. Otherwise,
   * we select the cell in the second column (because we assume the first column
   * is probably a PK column which can't accept data entry.)
   */
  ofNewRecordDataEntryCell(): SheetSelection {
    const rowId = this.plane.rowIds.last;
    if (!rowId) return this;
    const columnId = this.plane.columnIds.at(1) ?? this.plane.columnIds.first;
    if (!columnId) return this;
    return this.ofOneCell(makeCellId(rowId, columnId));
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
  ofRowRange(rowIdA: string, rowIdB: string): SheetSelection {
    return this.withBasis(
      basisFromDataCells(
        this.plane.dataCellsInFlexibleRowRange(rowIdA, rowIdB),
        makeCellId(rowIdA, this.plane.columnIds.first ?? ''),
      ),
    );
  }

  /**
   * @returns a new selection of all data cells in all columns between the
   * provided columnIds, inclusive.
   */
  ofColumnRange(columnIdA: string, columnIdB: string): SheetSelection {
    const newBasis = this.plane.rowIds.first
      ? basisFromDataCells(
          this.plane.dataCellsInColumnRange(columnIdA, columnIdB),
          makeCellId(this.plane.rowIds.first, columnIdA),
        )
      : basisFromEmptyColumns(this.plane.columnIds.range(columnIdA, columnIdB));
    return this.withBasis(newBasis);
  }

  /**
   * @returns a new selection of all data cells in the intersection of the
   * provided rows and columns.
   */
  ofRowColumnIntersection(
    rowIds: Iterable<string>,
    columnIds: Iterable<string>,
  ): SheetSelection {
    return this.withBasis(basisFromDataCells(makeCells(rowIds, columnIds)));
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
  ofDataCellRange(cellIdA: string, cellIdB: string): SheetSelection {
    return this.withBasis(
      basisFromDataCells(
        this.plane.dataCellsInFlexibleCellRange(cellIdA, cellIdB),
        cellIdA,
      ),
    );
  }

  ofSheetCellRange(
    startingCell: SheetCellDetails,
    endingCell: SheetCellDetails,
  ): SheetSelection {
    // Nullish coalescing is safe here since we know we'll have a first row and
    // first column in the cases where we're selecting things.
    const firstRow = () => this.plane.rowIds.first ?? '';
    const firstColumn = () => this.plane.columnIds.first ?? '';

    return match(startingCell, 'type', {
      'data-cell': ({ cellId: startingCellId }) => {
        const endingCellId = match(endingCell, 'type', {
          'data-cell': (b) => b.cellId,
          'column-header-cell': (b) => makeCellId(firstRow(), b.columnId),
          'row-header-cell': (b) => makeCellId(b.rowId, firstColumn()),
        });
        return this.ofDataCellRange(startingCellId, endingCellId);
      },

      'column-header-cell': ({ columnId: startingColumnId }) => {
        const endingColumnId = match(endingCell, 'type', {
          'data-cell': (b) => parseCellId(b.cellId).columnId,
          'column-header-cell': (b) => b.columnId,
          'row-header-cell': () => firstColumn(),
        });
        return this.ofColumnRange(startingColumnId, endingColumnId);
      },

      'row-header-cell': ({ rowId: startingRowId }) => {
        const endingRowId = match(endingCell, 'type', {
          'data-cell': (b) => parseCellId(b.cellId).rowId,
          'column-header-cell': () => firstRow(),
          'row-header-cell': (b) => b.rowId,
        });
        return this.ofRowRange(startingRowId, endingRowId);
      },
    });
  }

  /**
   * @returns a new selection formed from one cell within the data rows or the
   * placeholder row.
   */
  ofOneCell(cellId: string): SheetSelection {
    const { rowId } = parseCellId(cellId);
    const { placeholderRowId } = this.plane;
    const makeBasis =
      rowId === placeholderRowId
        ? basisFromPlaceholderCell
        : basisFromOneDataCell;
    return this.withBasis(makeBasis(cellId));
  }

  ofOneRow(rowId: string): SheetSelection {
    return this.ofRowRange(rowId, rowId);
  }

  ofOneColumn(columnId: string): SheetSelection {
    return this.ofColumnRange(columnId, columnId);
  }

  /**
   * @returns a new selection that fits within the provided plane. This is
   * relevant when paginating or when rows/columns are deleted/reordered/inserted.
   */
  forNewPlane(newPlane: Plane): SheetSelection {
    return new SheetSelection(
      newPlane,
      this.basis.adaptToModifiedPlane({ oldPlane: this.plane, newPlane }),
    );
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
  drawnToDataCell(cellId: string): SheetSelection {
    return this.ofDataCellRange(this.activeCellId ?? cellId, cellId);
  }

  /**
   * @returns a new selection formed by the cells in all the rows between the
   * active cell and the provided row, inclusive.
   */
  drawnToRow(rowId: string): SheetSelection {
    const activeRowId = this.activeCellId
      ? parseCellId(this.activeCellId).rowId
      : rowId;
    return this.ofRowRange(activeRowId, rowId);
  }

  drawnToColumn(columnId: string): SheetSelection {
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
  collapsedAndMoved(direction: Direction): SheetSelection {
    const newBasis = this.basis.collapsedAndMoved?.(direction, this.plane);
    if (newBasis) return this.withBasis(newBasis);

    if (this.activeCellId === undefined) {
      // If no cells are selected, then select the first data cell
      return this.ofFirstDataCell();
    }

    const adjacent = this.plane.getAdjacentCell(this.activeCellId, direction);

    if (adjacent.type === 'none') {
      // If we can't move anywhere, then do nothing
      return this;
    }
    if (adjacent.type === 'dataCell' || adjacent.type === 'placeholderCell') {
      // Move to an adjacent data cell or adjacent placeholder cell
      return this.ofOneCell(adjacent.cellId);
    }
    return assertExhaustive(adjacent);
  }

  /**
   * @returns a new selection with the active cell moved within the selection,
   * left to right, top to bottom.
   *
   * This is to handle the `Tab` and `Shift+Tab` keys.
   */
  withActiveCellAdvanced(
    direction: 'forward' | 'back' = 'forward',
  ): SheetSelection {
    // TODO

    // eslint-disable-next-line no-console
    console.log(direction, 'Active cell advancing is not yet implemented');
    return this;
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
  resized(direction: Direction): SheetSelection {
    // TODO

    // eslint-disable-next-line no-console
    console.log(direction, 'Sheet selection resizing is not yet implemented');
    return this;
  }
}
