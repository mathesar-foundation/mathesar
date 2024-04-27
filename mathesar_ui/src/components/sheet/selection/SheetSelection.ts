import { execPipe, filter, first, map } from 'iter-tools';

import { ImmutableSet } from '@mathesar/component-library';
import { match } from '@mathesar/utils/patternMatching';
import { assertExhaustive } from '@mathesar/utils/typeUtils';
import { makeCellId, makeCells, parseCellId } from '../cellIds';
import { Direction, getColumnOffset } from './Direction';
import Plane from './Plane';
import {
  fitSelectedValuesToSeriesTransformation,
  type SheetCellDetails,
} from './selectionUtils';

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
type BasisType = 'dataCells' | 'emptyColumns' | 'placeholderCell' | 'empty';

/**
 * This type stores data about "which cells are selected", with some redundancy
 * for efficient and consistent lookup across different kinds of selections.
 *
 * Due to the redundant nature of some properties on this type, you should be
 * sure to only instantiate Basis using the utility functions below. This will
 * ensure that the data is always valid.
 */
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

function basisFromOneDataCell(cellId: string): Basis {
  return basisFromDataCells([cellId], cellId);
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

function emptyBasis(): Basis {
  return {
    type: 'empty',
    activeCellId: undefined,
    cellIds: new ImmutableSet(),
    columnIds: new ImmutableSet(),
    rowIds: new ImmutableSet(),
  };
}

function getFullySelectedColumnIds(
  plane: Plane,
  basis: Basis,
): ImmutableSet<string> {
  if (basis.type === 'dataCells') {
    // The logic within this branch is somewhat complex because:
    // - We might want to support non-rectangular selections someday.
    // - For performance, we want to avoid iterating over all the selected
    //   cells.

    const selectedRowCount = basis.rowIds.size;
    const availableRowCount = plane.rowIds.length;
    if (selectedRowCount < availableRowCount) {
      // Performance heuristic. If the number of selected rows is less than the
      // total number of rows, we can assume that no column exist in which all
      // rows are selected.
      return new ImmutableSet();
    }

    const selectedColumnCount = basis.columnIds.size;
    const selectedCellCount = basis.cellIds.size;
    const avgCellsSelectedPerColumn = selectedCellCount / selectedColumnCount;
    if (avgCellsSelectedPerColumn === availableRowCount) {
      // Performance heuristic. We know that no column can have more cells
      // selected than the number of rows. Thus, if the average number of cells
      // selected per column is equal to the number of rows, then we know that
      // all selected columns are fully selected.
      return basis.columnIds;
    }

    // This is the worst-case scenario, performance-wise, which is why we try to
    // return early before hitting this branch. This case will only happen when
    // we have a mix of fully selected columns and partially selected columns.
    // This case should be rare because most (maybe all?) selections are
    // rectangular.
    const countSelectedCellsPerColumn = new Map<string, number>();
    for (const cellId of basis.cellIds) {
      const { columnId } = parseCellId(cellId);
      const count = countSelectedCellsPerColumn.get(columnId) ?? 0;
      countSelectedCellsPerColumn.set(columnId, count + 1);
    }
    const fullySelectedColumnIds = execPipe(
      countSelectedCellsPerColumn,
      filter(([, count]) => count === availableRowCount),
      map(([id]) => id),
    );
    return new ImmutableSet(fullySelectedColumnIds);
  }

  if (basis.type === 'emptyColumns') {
    return basis.columnIds;
  }

  if (basis.type === 'placeholderCell') {
    return new ImmutableSet();
  }

  if (basis.type === 'empty') {
    return new ImmutableSet();
  }

  return assertExhaustive(basis.type);
}

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

    this.fullySelectedColumnIds = getFullySelectedColumnIds(
      this.plane,
      this.basis,
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
    if (this.basis.type === 'dataCells') {
      if (!newPlane.hasResultRows) {
        return new SheetSelection(newPlane, basisFromZeroEmptyColumns());
      }

      const [minRowId, maxRowId] = fitSelectedValuesToSeriesTransformation(
        this.basis.rowIds,
        this.plane.rowIds,
        newPlane.rowIds,
      );
      const [minColumnId, maxColumnId] =
        fitSelectedValuesToSeriesTransformation(
          this.basis.columnIds,
          this.plane.columnIds,
          newPlane.columnIds,
        );
      if (
        minRowId === undefined ||
        maxRowId === undefined ||
        minColumnId === undefined ||
        maxColumnId === undefined
      ) {
        return new SheetSelection(newPlane);
      }

      const cellIds = newPlane.dataCellsInFlexibleRowColumnRange(
        minRowId,
        maxRowId,
        minColumnId,
        maxColumnId,
      );
      // TODO set active cell
      return new SheetSelection(newPlane, basisFromDataCells(cellIds));
    }

    if (this.basis.type === 'emptyColumns') {
      if (newPlane.hasResultRows) {
        return new SheetSelection(newPlane);
      }
      const minColumnId = newPlane.columnIds.min(this.basis.columnIds);
      const maxColumnId = newPlane.columnIds.max(this.basis.columnIds);
      if (minColumnId === undefined || maxColumnId === undefined) {
        return new SheetSelection(newPlane, basisFromZeroEmptyColumns());
      }
      const columnIds = newPlane.columnIds.range(minColumnId, maxColumnId);
      return new SheetSelection(newPlane, basisFromEmptyColumns(columnIds));
    }

    if (this.basis.type === 'placeholderCell') {
      const columnId = first(this.basis.columnIds);
      if (columnId === undefined) {
        return new SheetSelection(newPlane);
      }
      const newPlaneHasSelectedCell =
        newPlane.columnIds.has(columnId) &&
        newPlane.placeholderRowId === this.plane.placeholderRowId;
      if (newPlaneHasSelectedCell) {
        // If we can retain the selected placeholder cell, then do so.
        return new SheetSelection(newPlane, basisFromPlaceholderCell(columnId));
      }
      // Otherwise, return an empty selection
      return new SheetSelection(newPlane);
    }

    if (this.basis.type === 'empty') {
      // If the selection is empty, we keep it empty.
      return new SheetSelection(newPlane);
    }

    return assertExhaustive(this.basis.type);
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
  resized(direction: Direction): SheetSelection {
    // TODO
    console.log('Sheet selection resizing is not yet implemented');
    return this;
  }
}
