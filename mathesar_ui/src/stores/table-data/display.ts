import { writable, get, derived } from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { Writable, Readable, Unsubscriber } from 'svelte/store';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';
import type { Row, RecordsData } from './records';

export interface ColumnPosition {
  width: number;
  left: number;
}
/** keys are column ids */
export type ColumnPositionMap = Map<number, ColumnPosition>;

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number;
  columnIndex: number;
}

export const ROW_CONTROL_COLUMN_WIDTH = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;
export const DEFAULT_COLUMN_WIDTH = 160;

const movementKeys = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Tab',
]);

/**
 * This value is used as a key in a `ColumnPositionMap` where each entry
 * corresponds to the position of the column, as indexed by the column id.
 * However, the entry indexed by `ROW_POSITION_INDEX` consists of the total
 * width & left values (i.e the position) of the row. It's placed within
 * `ColumnPositionMap` in order to avoid calculation within the component, which
 * will run for each row. Thus, `ROW_POSITION_INDEX` should have the same type
 * as a column id but needs to have a value that no column id will ever have.
 * That's why we're using -1.
 *
 * We could use a dedicated store for it or even a new class containing both
 * columnPosition and row width.
 *
 * Pavish put it within ColumnPositionMap because we were passing around a lot
 * of props to the child components and he wanted to reduce the number of props.
 * Now, it is all passed down using context, so that's no longer an issue.
 */
export const ROW_POSITION_INDEX = -1;

function recalculateColumnPositions(
  columnPositionMap: ColumnPositionMap,
  columns: Column[],
) {
  let left = ROW_CONTROL_COLUMN_WIDTH;
  const newColumnPositionMap: ColumnPositionMap = new Map();
  columns.forEach((column) => {
    const columnWidth = columnPositionMap.get(column.id)?.width;
    const isColumnWidthValid = typeof columnWidth === 'number';
    const newWidth = isColumnWidthValid ? columnWidth : DEFAULT_COLUMN_WIDTH;
    newColumnPositionMap.set(column.id, {
      left,
      width: newWidth,
    });
    left += newWidth;
  });
  newColumnPositionMap.set(ROW_POSITION_INDEX, {
    width: left,
    left: 0,
  });
  return newColumnPositionMap;
}

export function isCellActive(
  activeCell: ActiveCell,
  row: Row,
  column: Column,
): boolean {
  return (
    activeCell &&
    activeCell?.columnIndex === column.__columnIndex &&
    activeCell.rowIndex === row.rowIndex
  );
}

// TODO: Create a common utility action to handle active element based scroll
export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null =
    document.querySelector('.cell.is-active');
  const activeRow = activeCell?.parentElement;
  const container = document.querySelector('.virtual-list.outerElement');
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

export class Display {
  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  private recordsData: RecordsData;

  private columnPositionMapUnsubscriber: Unsubscriber;

  scrollOffset: Writable<number>;

  horizontalScrollOffset: Writable<number>;

  columnPositionMap: Writable<ColumnPositionMap>;

  activeCell: Writable<ActiveCell | undefined>;

  rowWidth: Writable<number>;

  displayableRecords: Readable<Row[]>;

  constructor(
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    recordsData: RecordsData,
  ) {
    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.scrollOffset = writable(0);
    this.columnPositionMap = writable(new Map() as ColumnPositionMap);
    this.activeCell = writable<ActiveCell | undefined>(undefined);
    this.rowWidth = writable(0);

    // subscribers
    this.columnPositionMapUnsubscriber = this.columnsDataStore.subscribe(
      (columnData) => {
        this.columnPositionMap.update((map) =>
          recalculateColumnPositions(map, columnData.columns),
        );
        const width = get(this.columnPositionMap).get(
          ROW_POSITION_INDEX,
        )?.width;
        const widthWithPadding = width ? width + DEFAULT_ROW_RIGHT_PADDING : 0;
        this.rowWidth.set(widthWithPadding);
      },
    );

    const { savedRecords, newRecords } = this.recordsData;
    this.displayableRecords = derived(
      [savedRecords, newRecords],
      ([$savedRecords, $newRecords], set) => {
        let allRecords = $savedRecords;
        if ($newRecords.length > 0) {
          allRecords = allRecords
            .concat({
              identifier: '__new_help_text',
              isNewHelpText: true,
              state: States.Done,
            })
            .concat($newRecords);
        }
        allRecords = allRecords.concat({
          ...this.recordsData.getNewEmptyRecord(),
          isAddPlaceholder: true,
        });
        set(allRecords);
      },
    );
  }

  resetActiveCell(): void {
    this.activeCell.set(undefined);
  }

  selectCell(row: Row, column: Column): void {
    this.activeCell.set({
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      rowIndex: row.rowIndex,
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      columnIndex: column.__columnIndex,
    });
  }

  editCell(row: Row, column: Column): void {
    if (!column.primary_key) {
      this.activeCell.set({
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        rowIndex: row.rowIndex,
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        columnIndex: column.__columnIndex,
      });
    }
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent['key']): 'moved' | undefined {
    const { columns } = this.columnsDataStore.get();
    const totalCount = get(this.recordsData.totalCount);
    const savedRecords = get(this.recordsData.savedRecords);
    const newRecords = get(this.recordsData.newRecords);
    const pagination = get(this.meta.pagination);
    const { offset } = pagination;
    const pageSize = pagination.size;
    const minRowIndex = 0;
    const maxRowIndex =
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      Math.min(pageSize, totalCount - offset, savedRecords.length) +
      newRecords.length;
    const activeCell = get(this.activeCell);

    if (movementKeys.has(key) && activeCell) {
      this.activeCell.update((existing) => {
        if (!existing) {
          return undefined;
        }
        const newActiveCell = { ...existing };
        switch (key) {
          case 'ArrowDown':
            if (existing.rowIndex < maxRowIndex) {
              newActiveCell.rowIndex += 1;
            }
            break;
          case 'ArrowUp':
            if (existing.rowIndex > minRowIndex) {
              newActiveCell.rowIndex -= 1;
            }
            break;
          case 'ArrowRight':
          case 'Tab':
            if (existing.columnIndex < columns.length - 1) {
              newActiveCell.columnIndex += 1;
            }
            break;
          case 'ArrowLeft':
            if (existing.columnIndex > 0) {
              newActiveCell.columnIndex -= 1;
            }
            break;
          default:
            break;
        }
        return newActiveCell;
      });
      return 'moved';
    }

    return undefined;
  }

  destroy(): void {
    this.columnPositionMapUnsubscriber();
  }
}
