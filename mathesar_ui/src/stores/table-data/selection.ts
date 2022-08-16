import type { Column } from '@mathesar/api/tables/columns';
import { ImmutableSet, WritableSet } from '@mathesar-component-library';
import { get } from 'svelte/store';
import type { Row, RecordsData } from './records';
import type { ColumnsDataStore } from './columns';

const DEFAULT_ROW_INDEX = 0;

type Cell = [Row, Column];

// Creates Unique identifier for a cell using rowIndex and columnId
// Storing this identifier instead of an object {rowIndex: number, columnId: number}
// enables easier usage of the Set data type & faster equality checks
export const createSelectedCellIdentifier = (
  { rowIndex }: Row,
  { id }: Column,
): string => `${rowIndex || DEFAULT_ROW_INDEX}-${id}`;

// export const isRowSelected = (selectedCells: WritableSet<string>, {rowIndex}: Row): boolean => {
//   return selectedCells.some(cell => cell.startsWith(`${rowIndex}-`));
// }

// export const isColumnSelected = (selectedCells: WritableSet<string>, {id}: Column): boolean => {
//   return selectedCells.some(cell => cell.endsWith(`-${id}`));
// }

export const isCellSelected = (
  selectedCells: ImmutableSet<string>,
  row: Row,
  column: Column,
): boolean => selectedCells.has(createSelectedCellIdentifier(row, column));

export class Selection {
  private columnsDataStore: ColumnsDataStore;

  private recordsData: RecordsData;

  private selectionBounds:
    | {
        minRowIndex: number;
        maxRowIndex: number;
        minColumnIndex: number;
        maxColumnIndex: number;
      }
    | undefined;

  selectedCells: WritableSet<string>;

  constructor(columnsDataStore: ColumnsDataStore, recordsData: RecordsData) {
    this.selectedCells = new WritableSet<string>();
    this.columnsDataStore = columnsDataStore;
    this.recordsData = recordsData;

    // This event terminates the cell selection process
    // specially useful when selecting multiple cells
    // Adding this on document to enable boundry cells selection
    // when the user drags the mouse out of the table view
    document.addEventListener('mouseup', () => {
      this.onEndSelection();
    });
  }

  onStartSelection(row: Row, column: Column): void {
    // Clear any existing selection
    this.resetSelection();

    // Initialize the bounds of the selection
    this.selectionBounds = {
      minColumnIndex: column.id,
      maxColumnIndex: column.id,
      minRowIndex: row.rowIndex || DEFAULT_ROW_INDEX,
      maxRowIndex: row.rowIndex || DEFAULT_ROW_INDEX,
    };
  }

  onMouseEnterWhileSelection(row: Row, column: Column): void {
    const { rowIndex = DEFAULT_ROW_INDEX } = row;
    const columnIndex = column.id;

    // If there is no selection start cell,
    // this means the selection was never initiated
    if (!this.selectionBounds) {
      return;
    }

    this.selectionBounds = {
      minRowIndex: Math.min(this.selectionBounds.minRowIndex, rowIndex),
      maxRowIndex: Math.max(this.selectionBounds.maxRowIndex, rowIndex),
      minColumnIndex: Math.min(
        this.selectionBounds.minColumnIndex,
        columnIndex,
      ),
      maxColumnIndex: Math.max(
        this.selectionBounds.maxColumnIndex,
        columnIndex,
      ),
    };
  }

  get allRows(): Row[] {
    const { savedRecords, newRecords } = this.recordsData;
    return [...get(savedRecords), ...get(newRecords)];
  }

  get allColumns(): Column[] {
    return this.columnsDataStore.get().columns;
  }

  onEndSelection(): void {
    if (!this.selectionBounds) {
      return;
    }

    const { minRowIndex, maxRowIndex, minColumnIndex, maxColumnIndex } =
      this.selectionBounds;
    this.selectionBounds = undefined;

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
    this.selectMultipleCells(cells);
  }

  // private selectCell(row: Row, column: Column): void {
  //   this.selectedCells.add(createSelectedCellIdentifier(row, column));
  // }

  private selectMultipleCells(cells: Array<Cell>) {
    const identifiers = cells.map(([row, column]) =>
      createSelectedCellIdentifier(row, column),
    );
    this.selectedCells.addMultiple(identifiers);
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
}
