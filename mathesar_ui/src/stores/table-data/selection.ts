import type { Column } from '@mathesar/api/tables/columns';
import { ImmutableSet, WritableSet } from '@mathesar-component-library';
import { get } from 'svelte/store';
import type { Unsubscriber } from 'svelte/store';
import type { Row, RecordsData } from './records';
import type { ColumnsDataStore } from './columns';
import type { Display } from './display';

const DEFAULT_ROW_INDEX = 0;
const ROW_COLUMN_SEPARATOR = '-';

type Cell = [Row, Column];

type SelectionBounds = {
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
};

/**
 * Creates Unique identifier for a cell using rowIndex and columnId
 * Storing this identifier instead of an object {rowIndex: number, columnId: number}
 * enables easier usage of the Set data type & faster equality checks
 */
export const createSelectedCellIdentifier = (
  { rowIndex }: Row,
  { id }: Column,
): string => `${rowIndex || DEFAULT_ROW_INDEX}${ROW_COLUMN_SEPARATOR}${id}`;

export const isRowSelected = (
  selectedCells: ImmutableSet<string>,
  row: Row,
): boolean =>
  !!row.record &&
  selectedCells
    .valuesArray()
    .some((cell) => cell.startsWith(`${row.rowIndex || DEFAULT_ROW_INDEX}-`));

export const isColumnSelected = (
  selectedCells: ImmutableSet<string>,
  column: Column,
): boolean =>
  selectedCells.valuesArray().some((cell) => cell.endsWith(`-${column.id}`));

export const isCellSelected = (
  selectedCells: ImmutableSet<string>,
  row: Row,
  column: Column,
): boolean => selectedCells.has(createSelectedCellIdentifier(row, column));

export function getSelectedColumnId(selectedCell: string): number {
  return Number(selectedCell.split(ROW_COLUMN_SEPARATOR)[1]);
}

export function getSelectedRowId(selectedCell: string): number {
  return Number(selectedCell.split(ROW_COLUMN_SEPARATOR)[0]);
}

export class Selection {
  private columnsDataStore: ColumnsDataStore;

  private recordsData: RecordsData;

  private selectionBounds: SelectionBounds | undefined;

  private activeCellUnsubscriber: Unsubscriber;

  selectedCells: WritableSet<string>;

  freezeSelection: boolean;

  display: Display;

  constructor(
    columnsDataStore: ColumnsDataStore,
    recordsData: RecordsData,
    display: Display,
  ) {
    this.selectedCells = new WritableSet<string>();
    this.columnsDataStore = columnsDataStore;
    this.recordsData = recordsData;
    this.freezeSelection = false;
    this.display = display;

    // This event terminates the cell selection process
    // specially useful when selecting multiple cells
    // Adding this on document to enable boundry cells selection
    // when the user drags the mouse out of the table view
    document.addEventListener('mouseup', () => {
      this.onEndSelection();
    });

    // Keep active cell and selected cell in sync
    this.activeCellUnsubscriber = this.display.activeCell.subscribe(
      (activeCell) => {
        if (activeCell) {
          const activeCellRow = this.allRows.find(
            (row) => row.rowIndex === activeCell.rowIndex,
          );
          const activeCellColumn = this.allColumns.find(
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
      },
    );
  }

  onStartSelection(row: Row, column: Column): void {
    if (this.freezeSelection) {
      return;
    }
    // Clear any existing selection
    this.resetSelection();

    // Initialize the bounds of the selection
    this.selectionBounds = {
      startColumnIndex: column.id,
      endColumnIndex: column.id,
      startRowIndex: row.rowIndex || DEFAULT_ROW_INDEX,
      endRowIndex: row.rowIndex || DEFAULT_ROW_INDEX,
    };
  }

  onMouseEnterWhileSelection(row: Row, column: Column): void {
    const { rowIndex = DEFAULT_ROW_INDEX } = row;
    const columnIndex = column.id;

    // If there is no selection start cell,
    // this means the selection was never initiated
    if (!this.selectionBounds || this.freezeSelection) {
      return;
    }

    this.selectionBounds.endRowIndex = rowIndex;
    this.selectionBounds.endColumnIndex = columnIndex;
  }

  get allRows(): Row[] {
    const { savedRecords, newRecords } = this.recordsData;
    return [...get(savedRecords), ...get(newRecords)];
  }

  get allColumns(): Column[] {
    return this.columnsDataStore.get().columns;
  }

  onEndSelection(): void {
    if (this.selectionBounds) {
      const cells = this.getIncludedCells(this.selectionBounds);
      this.selectMultipleCells(cells);
      this.selectionBounds = undefined;
    }
  }

  getIncludedCells(selectionBounds: SelectionBounds): Cell[] {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } =
      selectionBounds;
    const minRowIndex = Math.min(startRowIndex, endRowIndex);
    const maxRowIndex = Math.max(startRowIndex, endRowIndex);
    const minColumnIndex = Math.min(startColumnIndex, endColumnIndex);
    const maxColumnIndex = Math.max(startColumnIndex, endColumnIndex);

    const cells: Cell[] = [];
    this.allRows.forEach((row) => {
      const { rowIndex = DEFAULT_ROW_INDEX } = row;
      if (rowIndex >= minRowIndex && rowIndex <= maxRowIndex) {
        this.allColumns.forEach((column) => {
          if (column.id >= minColumnIndex && column.id <= maxColumnIndex) {
            cells.push([row, column]);
          }
        });
      }
    });
    return cells;
  }

  private selectMultipleCells(cells: Array<Cell>) {
    const identifiers = cells.map(([row, column]) =>
      createSelectedCellIdentifier(row, column),
    );
    this.selectedCells.reconstruct(identifiers);
  }

  resetSelection(): void {
    this.selectionBounds = undefined;
    this.selectedCells.clear();
  }

  isCompleteColumnSelected(column: Column): boolean {
    return this.allRows.every((row) =>
      isCellSelected(get(this.selectedCells), row, column),
    );
  }

  isCompleteRowSelected(row: Row): boolean {
    return this.allColumns.every((column) =>
      isCellSelected(get(this.selectedCells), row, column),
    );
  }

  toggleColumnSelection(column: Column): void {
    const isCompleteColumnSelected = this.isCompleteColumnSelected(column);

    if (isCompleteColumnSelected) {
      // Clear the selection - deselect the column
      this.resetSelection();
    } else {
      const cells: Cell[] = [];
      this.allRows.forEach((row) => {
        cells.push([row, column]);
      });

      // Clearing the selection
      // since we do not have cmd+click to select
      // disjointed cells
      this.resetSelection();
      this.selectMultipleCells(cells);
    }
  }

  toggleRowSelection(row: Row): void {
    const isCompleteRowSelected = this.isCompleteRowSelected(row);

    if (isCompleteRowSelected) {
      // Clear the selection - deselect the row
      this.resetSelection();
    } else {
      const cells: Cell[] = [];
      this.allColumns.forEach((column) => {
        cells.push([row, column]);
      });

      // Clearing the selection
      // since we do not have cmd+click to select
      // disjointed cells
      this.resetSelection();
      this.selectMultipleCells(cells);
    }
  }

  destroy(): void {
    this.activeCellUnsubscriber();
  }
}
