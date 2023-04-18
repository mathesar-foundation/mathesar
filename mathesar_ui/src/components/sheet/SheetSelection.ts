import { ImmutableSet, WritableSet } from '@mathesar-component-library';
import { get, writable, type Unsubscriber, type Writable } from 'svelte/store';

export interface SelectionColumn {
  id: number | string;
  columnIndex: number;
}

export interface SelectionRow {
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
function scrollToElement(htmlElement: HTMLElement | null): void {
  const activeRow = htmlElement?.parentElement;
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
    htmlElement.offsetLeft + activeRow.clientWidth + 30 >
    container.scrollLeft + container.clientWidth
  ) {
    const offsetValue: number =
      container.getBoundingClientRect().right -
      htmlElement.getBoundingClientRect().right -
      30;
    container.scrollLeft -= offsetValue;
  } else if (htmlElement.offsetLeft - 30 < container.scrollLeft) {
    container.scrollLeft = htmlElement.offsetLeft - 30;
  }
}

export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null = document.querySelector(
    '[data-sheet-element="cell"].is-active',
  );
  scrollToElement(activeCell);
}

export function scrollBasedOnSelection(): void {
  const selectedCell: HTMLElement | null = document.querySelector(
    '[data-sheet-element="cell"].is-selected',
  );
  scrollToElement(selectedCell);
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
  { rowIndex }: Pick<SelectionRow, 'rowIndex'>,
  { id }: Pick<SelectionColumn, 'id'>,
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
  column: Pick<SelectionColumn, 'id'>,
): boolean =>
  columnsSelectedWhenTheTableIsEmpty.has(column.id) ||
  selectedCells.valuesArray().some((cell) => cell.endsWith(`-${column.id}`));

export const isCellSelected = (
  selectedCells: ImmutableSet<string>,
  row: Pick<SelectionRow, 'rowIndex'>,
  column: Pick<SelectionColumn, 'id'>,
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
        } else {
          // We need to unselect the Selected cells
          // when navigating Placeholder cells
          this.resetSelection();
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
    // Initialize the bounds of the selection
    this.selectionBounds = {
      startColumnIndex: column.columnIndex,
      endColumnIndex: column.columnIndex,
      startRowIndex: row.rowIndex,
      endRowIndex: row.rowIndex,
    };

    const cells = this.getIncludedCells(this.selectionBounds);
    this.selectMultipleCells(cells);
  }

  onMouseEnterCellWhileSelection(
    row: SelectionRow,
    column: SelectionColumn,
  ): void {
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

  selectAndActivateFirstCellIfExists(): void {
    const firstRow = this.getRows()[0];
    const firstColumn = this.getColumns()[0];
    if (firstRow && firstColumn) {
      this.selectMultipleCells([[firstRow, firstColumn]]);
      this.activateCell(firstRow, firstColumn);
    }
  }

  selectAndActivateFirstDataEntryCellInLastRow(): void {
    const currentRows = this.getRows();
    const currentColumns = this.getColumns();
    if (currentRows.length > 0 && currentColumns.length > 1) {
      this.activateCell(currentRows[currentRows.length - 1], currentColumns[1]);
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

  private isCompleteColumnSelected(column: Pick<Column, 'id'>): boolean {
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

  private isCompleteRowSelected(row: Pick<Row, 'rowIndex'>): boolean {
    const columns = this.getColumns();
    return (
      columns.length > 0 &&
      columns.every((column) =>
        isCellSelected(get(this.selectedCells), row, column),
      )
    );
  }

  isAnyColumnCompletelySelected(): boolean {
    const selectedCellsArray = get(this.selectedCells).valuesArray();
    const checkedColumns: (number | string)[] = [];

    for (const cell of selectedCellsArray) {
      const columnId = getSelectedColumnId(cell);
      if (!checkedColumns.includes(columnId)) {
        if (this.isCompleteColumnSelected({ id: columnId })) {
          return true;
        }
        checkedColumns.push(columnId);
      }
    }

    return false;
  }

  isAnyRowCompletelySelected(): boolean {
    const selectedCellsArray = get(this.selectedCells).valuesArray();
    const checkedRows: number[] = [];

    for (const cell of selectedCellsArray) {
      const rowIndex = getSelectedRowIndex(cell);
      if (!checkedRows.includes(rowIndex)) {
        if (this.isCompleteRowSelected({ rowIndex })) {
          return true;
        }
        checkedRows.push(rowIndex);
      }
    }

    return false;
  }

  /**
   * Modifies the selected cells, forming a new selection by maintaining the
   * currently selected rows but altering the selected columns to match the
   * supplied columns.
   */
  intersectSelectedRowsWithGivenColumns(columns: Column[]): void {
    const selectedRows = this.getSelectedUniqueRowsId(
      new ImmutableSet(this.selectedCells.getValues()),
    );
    const cells: Cell<Row, Column>[] = [];
    columns.forEach((column) => {
      selectedRows.forEach((rowIndex) => {
        const row = this.getRows()[rowIndex];
        cells.push([row, column]);
      });
    });

    this.selectMultipleCells(cells);
  }

  /**
   * Use this only for programmatic selection
   *
   * Prefer: onColumnSelectionStart when
   * selection is done using
   * user interactions
   */
  toggleColumnSelection(column: Column): boolean {
    const isCompleteColumnSelected = this.isCompleteColumnSelected(column);
    this.activateCell({ rowIndex: 0 }, column);

    if (isCompleteColumnSelected) {
      this.resetSelection();
      return false;
    }

    const rows = this.getRows();

    if (rows.length === 0) {
      this.resetSelection();
      this.columnsSelectedWhenTheTableIsEmpty.add(column.id);
      return true;
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
    return true;
  }

  /**
   * Use this only for programmatic selection
   *
   * Prefer: onRowSelectionStart when
   * selection is done using
   * user interactions
   */
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

  onColumnSelectionStart(column: Column): boolean {
    this.activateCell({ rowIndex: 0 }, { id: column.id });
    const rows = this.getRows();

    if (rows.length === 0) {
      this.resetSelection();
      this.columnsSelectedWhenTheTableIsEmpty.add(column.id);
      return true;
    }

    this.onStartSelection(rows[0], column);
    this.onMouseEnterCellWhileSelection(rows[rows.length - 1], column);
    return true;
  }

  onMouseEnterColumnHeaderWhileSelection(column: Column): boolean {
    const rows = this.getRows();

    if (rows.length === 0) {
      this.resetSelection();
      this.columnsSelectedWhenTheTableIsEmpty.add(column.id);
      return true;
    }

    this.onMouseEnterCellWhileSelection(rows[rows.length - 1], column);
    return true;
  }

  onRowSelectionStart(row: Row): boolean {
    const columns = this.getColumns();

    if (!columns.length) {
      // Not possible to have tables without columns
    }

    const startColumn = columns[0];
    const endColumn = columns[columns.length - 1];
    this.activateCell(row, startColumn);

    this.onStartSelection(row, startColumn);
    this.onMouseEnterCellWhileSelection(row, endColumn);
    return true;
  }

  onMouseEnterRowHeaderWhileSelection(row: Row): boolean {
    const columns = this.getColumns();

    if (!columns.length) {
      // Not possible to have tables without columns
    }

    const endColumn = columns[columns.length - 1];
    this.onMouseEnterCellWhileSelection(row, endColumn);
    return true;
  }

  resetActiveCell(): void {
    this.activeCell.set(undefined);
  }

  activateCell(row: Pick<Row, 'rowIndex'>, column: Pick<Column, 'id'>): void {
    this.activeCell.set({
      rowIndex: row.rowIndex,
      columnId: column.id,
    });
  }

  focusCell(row: Pick<Row, 'rowIndex'>, column: Pick<Column, 'id'>): void {
    const cellsInTheColumn = document.querySelectorAll(
      `[data-column-identifier="${column.id}"]`,
    );
    const targetCell = cellsInTheColumn.item(row.rowIndex);
    (targetCell?.querySelector('.cell-wrapper') as HTMLElement)?.focus();
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

  activateFirstCellInSelectedColumn() {
    const activeCell = get(this.activeCell);
    if (activeCell) {
      this.activateCell({ rowIndex: 0 }, { id: activeCell.columnId });
    }
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

  getSelectedUniqueRowsId(
    selectedCells: ImmutableSet<string>,
  ): Row['rowIndex'][] {
    const setOfUniqueRowIndex = new Set([
      ...[...selectedCells].map(getSelectedRowIndex),
    ]);
    return Array.from(setOfUniqueRowIndex);
  }

  destroy(): void {
    this.activeCellUnsubscriber();
  }
}
