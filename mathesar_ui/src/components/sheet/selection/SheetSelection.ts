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
  basisFromRangeRestrictedCell,
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
   * We use the last row because that's where we add new records.
   * We receive an optional columnId to select since this is a user triggered event
   * and use the first column as default if the columnId is not passed or is invalid.
   */
  ofNewRecordDataEntryCell(
    columnIdToSelect = this.plane.columnIds.first,
  ): SheetSelection {
    const rowId = this.plane.rowIds.last;
    if (!rowId) return this;
    const columnIndex = columnIdToSelect
      ? this.plane.columnIds.getIndex(columnIdToSelect)
      : 0;
    const columnId = this.plane.columnIds.at(columnIndex ?? 0);
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
   *
   * Columns with range selection restrictions are excluded from row selections, they can only be
   * selected individually.
   */
  ofRowRange(rowIdA: string, rowIdB: string): SheetSelection {
    const regularCells = this.filterRestrictedCells(
      this.plane.dataCellsInFlexibleRowRange(rowIdA, rowIdB),
    );
    const firstRegularColumnId = this.filterRestrictedColumns(
      this.plane.columnIds,
    )[0];
    const activeCellId = firstRegularColumnId
      ? makeCellId(rowIdA, firstRegularColumnId)
      : undefined;
    return this.withBasis(basisFromDataCells(regularCells, activeCellId));
  }

  /**
   * @returns a new selection of all data cells in all columns between the
   * provided columnIds, inclusive.
   */
  ofColumnRange(columnIdA: string, columnIdB: string): SheetSelection {
    // If starting column is range-restricted, only select that one column's first cell
    if (this.plane.rangeRestrictedColumnIds.has(columnIdA)) {
      return this.selectFirstCellInColumn(columnIdA);
    }

    // If ending column is range-restricted, find the last normal column before it
    let adjustedColumnIdB = columnIdB;
    if (this.plane.rangeRestrictedColumnIds.has(columnIdB)) {
      const lastNormalColumn = this.findLastNormalColumnInRange(
        columnIdA,
        columnIdB,
      );
      if (!lastNormalColumn) {
        // No normal columns in range, only select the starting column's first cell
        return this.selectFirstCellInColumn(columnIdA);
      }
      adjustedColumnIdB = lastNormalColumn;
    }

    const newBasis = this.plane.rowIds.first
      ? basisFromDataCells(
          this.filterRestrictedCells(
            this.plane.dataCellsInColumnRange(columnIdA, adjustedColumnIdB),
          ),
          makeCellId(this.plane.rowIds.first, columnIdA),
        )
      : basisFromEmptyColumns(
          this.filterRestrictedColumns(
            this.plane.columnIds.range(columnIdA, adjustedColumnIdB),
          ),
        );
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
    return this.withBasis(
      basisFromDataCells(
        this.filterRestrictedCells(makeCells(rowIds, columnIds)),
      ),
    );
  }

  private filterRestrictedCells(cellIds: Iterable<string>): string[] {
    return [...cellIds].filter((cellId) => {
      const { columnId } = parseCellId(cellId);
      return !this.plane.rangeRestrictedColumnIds.has(columnId);
    });
  }

  private filterRestrictedColumns(columnIds: Iterable<string>): string[] {
    return [...columnIds].filter(
      (columnId) => !this.plane.rangeRestrictedColumnIds.has(columnId),
    );
  }

  private selectFirstCellInColumn(columnId: string): SheetSelection {
    if (!this.plane.rowIds.first) {
      return this.withBasis(basisFromZeroEmptyColumns());
    }
    const cellId = makeCellId(this.plane.rowIds.first, columnId);
    return this.withBasis(basisFromDataCells([cellId], cellId));
  }

  /**
   * Find the last normal (non-range-restricted) column in a range.
   * Returns undefined if no normal columns exist in the range.
   */
  private findLastNormalColumnInRange(
    columnIdA: string,
    columnIdB: string,
  ): string | undefined {
    const normalColumns = this.filterRestrictedColumns(
      this.plane.columnIds.range(columnIdA, columnIdB),
    );
    return normalColumns.length > 0
      ? normalColumns[normalColumns.length - 1]
      : undefined;
  }

  /**
   * Adjust a column ID if it's restricted by finding the last normal column before it.
   * Returns the original columnId if it's not restricted or if no normal columns
   * exist in the range.
   */
  private adjustRestrictedColumn(
    startingColumnId: string,
    endingColumnId: string,
  ): string {
    if (!this.plane.rangeRestrictedColumnIds.has(endingColumnId)) {
      return endingColumnId;
    }
    return (
      this.findLastNormalColumnInRange(startingColumnId, endingColumnId) ??
      startingColumnId
    );
  }

  /**
   * @returns a new selection formed by the rectangle between the provided
   * cells, inclusive.
   *
   * If either of the provided cells are in the placeholder row, then the cell
   * in the last data row will be used in its place. This ensures that the
   * selection is made only of data cells, and will never include cells in the
   * placeholder row, even if a user drags to select a cell in it.
   *
   * Columns with range restrictions are excluded from range selections, they can only be
   * selected individually. When a range includes columns with range restrictions, the
   * selection extends up to the last normal column before the restricted column.
   */
  ofDataCellRange(cellIdA: string, cellIdB: string): SheetSelection {
    const cellA = parseCellId(cellIdA);
    const cellB = parseCellId(cellIdB);

    // If starting cell is in a range-restricted column, only select that one cell
    if (this.plane.rangeRestrictedColumnIds.has(cellA.columnId)) {
      return this.ofOneCell(cellIdA);
    }

    // If ending cell is in a range-restricted column, find the last normal column
    // before it and adjust the ending cell accordingly
    let adjustedCellB = cellIdB;
    if (this.plane.rangeRestrictedColumnIds.has(cellB.columnId)) {
      const lastNormalColumn = this.findLastNormalColumnInRange(
        cellA.columnId,
        cellB.columnId,
      );
      if (!lastNormalColumn) {
        // No normal columns in range, only select the starting cell
        return this.ofOneCell(cellIdA);
      }
      adjustedCellB = makeCellId(cellB.rowId, lastNormalColumn);
    }

    return this.withBasis(
      basisFromDataCells(
        this.filterRestrictedCells(
          this.plane.dataCellsInFlexibleCellRange(cellIdA, adjustedCellB),
        ),
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
      // Range-restricted cells can only be selected individually
      'range-restricted-data-cell': ({ cellId: startingCellId }) =>
        this.ofOneCell(startingCellId),

      'data-cell': ({ cellId: startingCellId }) => {
        const { columnId: startingColumnId } = parseCellId(startingCellId);
        const endingCellId = match(endingCell, 'type', {
          'data-cell': (b) => b.cellId,
          'range-restricted-data-cell': (b) => {
            const { rowId, columnId } = parseCellId(b.cellId);
            const adjustedColumn = this.adjustRestrictedColumn(
              startingColumnId,
              columnId,
            );
            return makeCellId(rowId, adjustedColumn);
          },
          'column-header-cell': (b) => {
            const adjustedColumn = this.adjustRestrictedColumn(
              startingColumnId,
              b.columnId,
            );
            return makeCellId(firstRow(), adjustedColumn);
          },
          'row-header-cell': (b) => makeCellId(b.rowId, firstColumn()),
          'placeholder-row-header-cell': (b) =>
            makeCellId(b.rowId, firstColumn()),
          'placeholder-data-cell': (b) => b.cellId,
        });
        return this.ofDataCellRange(startingCellId, endingCellId);
      },

      'column-header-cell': ({ columnId: startingColumnId }) => {
        // If starting column is range-restricted, don't allow range selection
        if (this.plane.rangeRestrictedColumnIds.has(startingColumnId)) {
          return match(endingCell, 'type', {
            'data-cell': (b) => this.ofOneCell(b.cellId),
            'range-restricted-data-cell': (b) => this.ofOneCell(b.cellId),
            'column-header-cell': (b) => {
              if (this.plane.rangeRestrictedColumnIds.has(b.columnId)) {
                return this.ofOneCell(makeCellId(firstRow(), b.columnId));
              }
              return this.ofOneCell(makeCellId(firstRow(), startingColumnId));
            },
            'row-header-cell': () =>
              this.ofOneCell(makeCellId(firstRow(), startingColumnId)),
            'placeholder-row-header-cell': () =>
              this.ofOneCell(makeCellId(firstRow(), startingColumnId)),
            'placeholder-data-cell': (b) => this.ofOneCell(b.cellId),
          });
        }
        const endingColumnId = match(endingCell, 'type', {
          'data-cell': (b) =>
            this.adjustRestrictedColumn(
              startingColumnId,
              parseCellId(b.cellId).columnId,
            ),
          'range-restricted-data-cell': (b) =>
            this.adjustRestrictedColumn(
              startingColumnId,
              parseCellId(b.cellId).columnId,
            ),
          'column-header-cell': (b) =>
            this.adjustRestrictedColumn(startingColumnId, b.columnId),
          'row-header-cell': () => firstColumn(),
          'placeholder-row-header-cell': () => firstColumn(),
          'placeholder-data-cell': (b) =>
            this.adjustRestrictedColumn(
              startingColumnId,
              parseCellId(b.cellId).columnId,
            ),
        });
        return this.ofColumnRange(startingColumnId, endingColumnId);
      },

      'row-header-cell': ({ rowId: startingRowId }) => {
        const endingRowId = match(endingCell, 'type', {
          'data-cell': (b) => parseCellId(b.cellId).rowId,
          'range-restricted-data-cell': (b) => parseCellId(b.cellId).rowId,
          'column-header-cell': () => firstRow(),
          'row-header-cell': (b) => b.rowId,
          'placeholder-row-header-cell': (b) => b.rowId,
          'placeholder-data-cell': (b) => parseCellId(b.cellId).rowId,
        });
        return this.ofRowRange(startingRowId, endingRowId);
      },

      'placeholder-row-header-cell': ({ rowId }) =>
        this.ofRowRange(rowId, rowId),

      'placeholder-data-cell': ({ cellId: startingCellId }) =>
        match(endingCell, 'type', {
          'data-cell': () => this.ofOneCell(startingCellId),
          'range-restricted-data-cell': () => this.ofOneCell(startingCellId),
          'column-header-cell': () => this.ofOneCell(startingCellId),
          'row-header-cell': () => this.ofOneCell(startingCellId),
          'placeholder-row-header-cell': () => this.ofOneCell(startingCellId),
          'placeholder-data-cell': ({ cellId: endingCellId }) =>
            this.ofOneCell(endingCellId),
        }),
    });
  }

  /**
   * @returns a new selection formed from one cell within the data rows, or the
   * placeholder row, or range-restricted columns.
   */
  ofOneCell(cellId: string): SheetSelection {
    const { rowId, columnId } = parseCellId(cellId);
    const { placeholderRowId } = this.plane;
    let makeBasis;
    if (rowId === placeholderRowId) {
      makeBasis = basisFromPlaceholderCell;
    } else if (this.plane.rangeRestrictedColumnIds.has(columnId)) {
      makeBasis = basisFromRangeRestrictedCell;
    } else {
      makeBasis = basisFromOneDataCell;
    }
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
    if (!this.activeCellId) {
      // If there is no active cell, then select first cell -- same in Google sheet
      return this.ofFirstDataCell();
    }

    // "Anchor" of the rectangle that contains all selected cells
    const { rowId: anchorRowId, columnId: anchorColumnId } = parseCellId(
      this.activeCellId,
    );

    // Array for row/col ids
    const rowOrder = [...this.plane.rowIds];
    const colOrder = [...this.plane.columnIds];

    // Row/col id string to index
    const rowIndex = (id: string) => rowOrder.indexOf(id);
    const colIndex = (id: string) => colOrder.indexOf(id);

    // Anchor row/col index
    const anchorRowIndex = rowIndex(anchorRowId);
    const anchorColIndex = colIndex(anchorColumnId);

    // Boundary
    if (anchorRowIndex === -1 || anchorColIndex === -1) {
      return this;
    }

    // Row or Col ids to indices in ascending order
    const selectedRowIndices = [...this.rowIds]
      .map(rowIndex)
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);
    const selectedColIndices = [...this.columnIds]
      .map(colIndex)
      .filter((i) => i !== -1)
      .sort((a, b) => a - b);

    // Top-left and Bottom-right coordinates
    const topRowIndex =
      selectedRowIndices.length > 0 ? selectedRowIndices[0] : anchorRowIndex;
    const bottomRowIndex =
      selectedRowIndices.length > 0
        ? selectedRowIndices[selectedRowIndices.length - 1]
        : anchorRowIndex;
    const leftColIndex =
      selectedColIndices.length > 0 ? selectedColIndices[0] : anchorColIndex;
    const rightColIndex =
      selectedColIndices.length > 0
        ? selectedColIndices[selectedColIndices.length - 1]
        : anchorColIndex;

    // Extent is the diagonal opposite for Anchor
    let extentRowIndex =
      anchorRowIndex === topRowIndex ? bottomRowIndex : topRowIndex;
    let extentColIndex =
      anchorColIndex === leftColIndex ? rightColIndex : leftColIndex;

    // Move extent point with a direction
    switch (direction) {
      case 'up': {
        if (extentRowIndex <= 0) return this;
        extentRowIndex -= 1;
        break;
      }
      case 'down': {
        if (extentRowIndex >= rowOrder.length - 1) return this;
        extentRowIndex += 1;
        break;
      }
      case 'left': {
        if (extentColIndex <= 0) return this;
        extentColIndex -= 1;
        break;
      }
      case 'right': {
        if (extentColIndex >= colOrder.length - 1) return this;
        extentColIndex += 1;
        break;
      }
      default:
        return this;
    }

    // Make cell id for Extent point
    const newExtentRowId = rowOrder[extentRowIndex];
    const newExtentColId = colOrder[extentColIndex];
    if (!newExtentRowId || !newExtentColId) {
      return this;
    }
    const newExtentCellId = makeCellId(newExtentRowId, newExtentColId);

    return this.ofDataCellRange(this.activeCellId, newExtentCellId);
  }
}
