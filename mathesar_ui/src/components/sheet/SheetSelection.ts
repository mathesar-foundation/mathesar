import { ImmutableSet, WritableSet } from '@mathesar-component-library';
import { get, writable, type Unsubscriber, type Writable } from 'svelte/store';

interface SelectionColumn {
  id: number | string;
  columnIndex: number;
}

interface SelectionRow {
  rowIndex: number;
}

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number;
  columnId: number | string;
}

enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

function getDirection(event: KeyboardEvent): Direction | undefined {
  const { key } = event;
  const shift = event.shiftKey;
  switch (true) {
    case shift && key === 'Tab':
      return Direction.Left;
    case shift:
      return undefined;
    case key === 'ArrowUp':
      return Direction.Up;
    case key === 'ArrowDown':
      return Direction.Down;
    case key === 'ArrowLeft':
      return Direction.Left;
    case key === 'ArrowRight':
    case key === 'Tab':
      return Direction.Right;
    default:
      return undefined;
  }
}

function getHorizontalDelta(direction: Direction): number {
  switch (direction) {
    case Direction.Left:
      return -1;
    case Direction.Right:
      return 1;
    default:
      return 0;
  }
}

function getVerticalDelta(direction: Direction): number {
  switch (direction) {
    case Direction.Up:
      return -1;
    case Direction.Down:
      return 1;
    default:
      return 0;
  }
}

export function isCellActive(
  activeCell: ActiveCell,
  row: SelectionRow,
  column: SelectionColumn,
): boolean {
  return (
    activeCell &&
    activeCell?.columnId === column.id &&
    activeCell.rowIndex === row.rowIndex
  );
}

// TODO: Create a common utility action to handle active element based scroll
export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null = document.querySelector(
    '[data-sheet-element="cell"].is-active',
  );
  const activeRow = activeCell?.parentElement;
  const container = document.querySelector('[data-sheet-body-element="list"]');
  if (!container || !activeRow) {
    return;
  }
  // Vertical scroll
  if (
    activeRow.offsetTop + activeRow.clientHeight + 40 >
    container.scrollTop + container.clientHeight
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().bottom -
      activeRow.getBoundingClientRect().bottom -
      40;
    container.scrollTop -= offsetValue;
  } else if (activeRow.offsetTop - 30 < container.scrollTop) {
    container.scrollTop = activeRow.offsetTop - 30;
  }

  // Horizontal scroll
  if (
    activeCell.offsetLeft + activeRow.clientWidth + 30 >
    container.scrollLeft + container.clientWidth
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().right -
      activeCell.getBoundingClientRect().right -
      30;
    container.scrollLeft -= offsetValue;
  } else if (activeCell.offsetLeft - 30 < container.scrollLeft) {
    container.scrollLeft = activeCell.offsetLeft - 30;
  }
}

type SelectionBounds = {
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
};

type Cell<Row extends SelectionRow, Column extends SelectionColumn> = [
  Row,
  Column,
];

const ROW_COLUMN_SEPARATOR = '-';

/**
 * Creates Unique identifier for a cell using rowIndex and columnId
 * Storing this identifier instead of an object {rowIndex: number, columnId: number}
 * enables easier usage of the Set data type & faster equality checks
 */
const createSelectedCellIdentifier = (
  { rowIndex }: SelectionRow,
  { id }: SelectionColumn,
): string => `${rowIndex}${ROW_COLUMN_SEPARATOR}${id}`;

export const isRowSelected = (
  selectedCells: ImmutableSet<string>,
  row: SelectionRow,
): boolean =>
  selectedCells
    .valuesArray()
    .some((cell) => cell.startsWith(`${row.rowIndex}-`));

export const isColumnSelected = (
  selectedCells: ImmutableSet<string>,
  columnsSelectedWhenTheTableIsEmpty: ImmutableSet<SelectionColumn['id']>,
  column: SelectionColumn,
): boolean =>
  columnsSelectedWhenTheTableIsEmpty.has(column.id) ||
  selectedCells.valuesArray().some((cell) => cell.endsWith(`-${column.id}`));

export const isCellSelected = (
  selectedCells: ImmutableSet<string>,
  row: SelectionRow,
  column: SelectionColumn,
): boolean => selectedCells.has(createSelectedCellIdentifier(row, column));

function getSelectedColumnId(selectedCell: string): SelectionColumn['id'] {
  const columnId = selectedCell.split(ROW_COLUMN_SEPARATOR)[1];
  const numericalColumnId = Number(columnId);
  if (Number.isNaN(numericalColumnId)) {
    return columnId;
  }
  return numericalColumnId;
}

export function getSelectedRowIndex(selectedCell: string): number {
  return Number(selectedCell.split(ROW_COLUMN_SEPARATOR)[0]);
}

export default class SheetSelection<
  Row extends SelectionRow,
  Column extends SelectionColumn,
> {
  private getColumns: () => Column[];

  private getRows: () => Row[];

  // max index is inclusive
  private getMaxSelectionRowIndex: () => number;

  activeCell: Writable<ActiveCell | undefined>;

  private selectionBounds: SelectionBounds | undefined;

  private activeCellUnsubscriber: Unsubscriber;

  selectedCells: WritableSet<string>;

  /**
   * When the table has a non-zero number of rows, we store the user's selection
   * in the `selectedCells` store. But when the table has no rows (and thus no
   * cells) we still need a way to select columns to configure the data types,
   * so we use this store as a workaround. More elegant solutions are being
   * discussed in [1732][1].
   *
   * [1]: https://github.com/centerofci/mathesar/issues/1732
   */
  columnsSelectedWhenTheTableIsEmpty: WritableSet<Column['id']>;

  freezeSelection: boolean;

  constructor(args: {
    getColumns: () => Column[];
    getRows: () => Row[];
    getMaxSelectionRowIndex: () => number;
  }) {
    this.selectedCells = new WritableSet<string>();
    this.columnsSelectedWhenTheTableIsEmpty = new WritableSet<Column['id']>();
    this.getColumns = args.getColumns;
    this.getRows = args.getRows;
    this.getMaxSelectionRowIndex = args.getMaxSelectionRowIndex;
    this.freezeSelection = false;
    this.activeCell = writable<ActiveCell | undefined>(undefined);

    /**
     * TODO:
     * - This adds a document level event listener for each selection
     * store instance, and the listener doesn't seem to get removed.
     * - Refactor this logic and avoid such listeners within the store instance.
     */
    // This event terminates the cell selection process
    // specially useful when selecting multiple cells
    // Adding this on document to enable boundry cells selection
    // when the user drags the mouse out of the table view
    document.addEventListener('mouseup', () => {
      this.onEndSelection();
    });

    // Keep active cell and selected cell in sync
    this.activeCellUnsubscriber = this.activeCell.subscribe((activeCell) => {
      if (activeCell) {
        const activeCellRow = this.getRows().find(
          (row) => row.rowIndex === activeCell.rowIndex,
        );
        const activeCellColumn = this.getColumns().find(
          (column) => column.id === activeCell.columnId,
        );
        if (activeCellRow && activeCellColumn) {
          /**
           * This handles the very rare edge case
           * when the user starts the selection using mouse
           * but before ending(mouseup event)
           * she change the active cell using keyboard
           */
          this.selectionBounds = undefined;
          this.selectMultipleCells([[activeCellRow, activeCellColumn]]);
        }
      } else {
        this.resetSelection();
      }
    });
  }

  onStartSelection(row: SelectionRow, column: SelectionColumn): void {
    if (this.freezeSelection) {
      return;
    }
    // Clear any existing selection
    this.resetSelection();

    // Initialize the bounds of the selection
    this.selectionBounds = {
      startColumnIndex: column.columnIndex,
      endColumnIndex: column.columnIndex,
      startRowIndex: row.rowIndex,
      endRowIndex: row.rowIndex,
    };
  }

  onMouseEnterWhileSelection(row: SelectionRow, column: SelectionColumn): void {
    const { rowIndex } = row;
    const { columnIndex } = column;

    // If there is no selection start cell,
    // this means the selection was never initiated
    if (!this.selectionBounds || this.freezeSelection) {
      return;
    }

    this.selectionBounds.endRowIndex = rowIndex;
    this.selectionBounds.endColumnIndex = columnIndex;

    const cells = this.getIncludedCells(this.selectionBounds);
    this.selectMultipleCells(cells);
  }

  onEndSelection(): void {
    if (this.selectionBounds) {
      const cells = this.getIncludedCells(this.selectionBounds);
      this.selectMultipleCells(cells);
      this.selectionBounds = undefined;
    }
  }

  getIncludedCells(selectionBounds: SelectionBounds): Cell<Row, Column>[] {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } =
      selectionBounds;
    const minRowIndex = Math.min(startRowIndex, endRowIndex);
    const maxRowIndex = Math.max(startRowIndex, endRowIndex);
    const minColumnIndex = Math.min(startColumnIndex, endColumnIndex);
    const maxColumnIndex = Math.max(startColumnIndex, endColumnIndex);

    const cells: Cell<Row, Column>[] = [];
    this.getRows().forEach((row) => {
      const { rowIndex } = row;
      if (rowIndex >= minRowIndex && rowIndex <= maxRowIndex) {
        this.getColumns().forEach((column) => {
          if (
            column.columnIndex >= minColumnIndex &&
            column.columnIndex <= maxColumnIndex
          ) {
            cells.push([row, column]);
          }
        });
      }
    });
    return cells;
  }

  private selectMultipleCells(cells: Array<Cell<Row, Column>>) {
    const identifiers = cells.map(([row, column]) =>
      createSelectedCellIdentifier(row, column),
    );
    this.selectedCells.reconstruct(identifiers);
  }

  resetSelection(): void {
    this.selectionBounds = undefined;
    this.columnsSelectedWhenTheTableIsEmpty.clear();
    this.selectedCells.clear();
  }

  private isCompleteColumnSelected(column: Column): boolean {
    if (this.getRows().length) {
      return (
        this.columnsSelectedWhenTheTableIsEmpty.getHas(column.id) ||
        this.getRows().every((row) =>
          isCellSelected(get(this.selectedCells), row, column),
        )
      );
    }
    return this.columnsSelectedWhenTheTableIsEmpty.getHas(column.id);
  }

  private isCompleteRowSelected(row: Row): boolean {
    const columns = this.getColumns();
    return (
      columns.length > 0 &&
      columns.every((column) =>
        isCellSelected(get(this.selectedCells), row, column),
      )
    );
  }

  clearColumnSelection(column: Column): boolean {
    const isCompleteColumnSelected = this.isCompleteColumnSelected(column);

    if (isCompleteColumnSelected) {
      this.resetSelection();
      return true;
    }

    return false;
  }

  toggleColumnSelection(column: Column): void {
    if (this.clearColumnSelection(column)) {
      return;
    }

    const rows = this.getRows();

    if (rows.length === 0) {
      this.resetSelection();
      this.columnsSelectedWhenTheTableIsEmpty.add(column.id);
      return;
    }

    const cells: Cell<Row, Column>[] = [];
    rows.forEach((row) => {
      cells.push([row, column]);
    });

    // Clearing the selection
    // since we do not have cmd+click to select
    // disjointed cells
    this.resetSelection();
    this.selectMultipleCells(cells);
  }

  toggleRowSelection(row: Row): void {
    const isCompleteRowSelected = this.isCompleteRowSelected(row);

    if (isCompleteRowSelected) {
      // Clear the selection - deselect the row
      this.resetSelection();
    } else {
      const cells: Cell<Row, Column>[] = [];
      this.getColumns().forEach((column) => {
        cells.push([row, column]);
      });

      // Clearing the selection
      // since we do not have cmd+click to select
      // disjointed cells
      this.resetSelection();
      this.selectMultipleCells(cells);
    }
  }

  resetActiveCell(): void {
    this.activeCell.set(undefined);
  }

  activateCell(row: Row, column: Column): void {
    this.activeCell.set({
      rowIndex: row.rowIndex,
      columnId: column.id,
    });
  }

  private getAdjacentCell(
    activeCell: ActiveCell,
    direction: Direction,
  ): ActiveCell | undefined {
    const rowIndex = (() => {
      const delta = getVerticalDelta(direction);
      if (delta === 0) {
        return activeCell.rowIndex;
      }
      const minRowIndex = 0;
      const maxRowIndex = this.getMaxSelectionRowIndex();
      const newRowIndex = activeCell.rowIndex + delta;
      if (newRowIndex < minRowIndex || newRowIndex > maxRowIndex) {
        return undefined;
      }
      return newRowIndex;
    })();
    if (rowIndex === undefined) {
      return undefined;
    }

    const columnId = (() => {
      const delta = getHorizontalDelta(direction);
      if (delta === 0) {
        return activeCell.columnId;
      }
      const columns = this.getColumns();
      const index = columns.findIndex((c) => c.id === activeCell.columnId);
      const target = columns[index + delta] as Column | undefined;
      return target?.id;
    })();
    if (columnId === undefined) {
      return undefined;
    }

    return { rowIndex, columnId };
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent): 'moved' | undefined {
    const direction = getDirection(key);
    if (!direction) {
      return undefined;
    }
    let moved = false;
    this.activeCell.update((activeCell) => {
      if (!activeCell) {
        return undefined;
      }
      const adjacentCell = this.getAdjacentCell(activeCell, direction);
      if (adjacentCell) {
        moved = true;
        return adjacentCell;
      }
      return activeCell;
    });

    return moved ? 'moved' : undefined;
  }

  /**
   * This method does not utilize class properties inorder
   * to make it reactive during component usage.
   *
   * It is placed within the class inorder to make use of
   * class types
   */
  getSelectedUniqueColumnsId(
    selectedCells: ImmutableSet<string>,
    columnsSelectedWhenTheTableIsEmpty: ImmutableSet<Column['id']>,
  ): Column['id'][] {
    const setOfUniqueColumnIds = new Set([
      ...[...selectedCells].map(getSelectedColumnId),
      ...columnsSelectedWhenTheTableIsEmpty,
    ]);
    return Array.from(setOfUniqueColumnIds);
  }

  destroy(): void {
    this.activeCellUnsubscriber();
  }
}
