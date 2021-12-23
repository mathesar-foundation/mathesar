import { writable, get, derived } from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { Writable, Readable, Unsubscriber } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';
import type { TableRecord, RecordsData } from './records';

export interface ColumnPosition {
  width: number,
  left: number
}
export type ColumnPositionMap = Map<string, ColumnPosition>;

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number,
  columnIndex: number,
  type: 'select' | 'edit'
}

export const ROW_CONTROL_COLUMN_WIDTH = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;
export const DEFAULT_COLUMN_WIDTH = 160;

const movementKeys = new Set(['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Tab']);

function recalculateColumnPositions(columnPositionMap: ColumnPositionMap, columns: Column[]) {
  let left = ROW_CONTROL_COLUMN_WIDTH;
  const newColumnPositionMap: ColumnPositionMap = new Map();
  columns.forEach((column) => {
    const columnWidth = columnPositionMap.get(column.name)?.width;
    const isColumnWidthValid = typeof columnWidth === 'number';
    const newWidth = isColumnWidthValid ? columnWidth : DEFAULT_COLUMN_WIDTH;
    newColumnPositionMap.set(column.name, {
      left,
      width: newWidth,
    });
    left += newWidth;
  });
  newColumnPositionMap.set('__row', {
    width: left,
    left: 0,
  });
  return newColumnPositionMap;
}

export function isCellActive(
  activeCell: ActiveCell,
  row: TableRecord,
  column: Column,
): boolean {
  return activeCell
    && activeCell?.columnIndex === column.__columnIndex
    && activeCell.rowIndex === row.__rowIndex;
}

export function isCellBeingEdited(
  activeCell: ActiveCell,
  row: TableRecord,
  column: Column,
): boolean {
  return isCellActive(activeCell, row, column) && activeCell.type === 'edit';
}

// TODO: Create a common utility action to handle active element based scroll
export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement | null = document.querySelector('.cell.is-active');
  const activeRow = activeCell?.parentElement;
  const container = document.querySelector('.virtual-list.outerElement');
  if (!container || !activeRow) {
    return;
  }
  // Vertical scroll
  if (activeRow.offsetTop + activeRow.clientHeight + 40
    > (container.scrollTop + container.clientHeight)) {
    const offsetValue: number = container.getBoundingClientRect().bottom
      - activeRow.getBoundingClientRect().bottom - 40;
    container.scrollTop -= offsetValue;
  } else if (activeRow.offsetTop - 30 < container.scrollTop) {
    container.scrollTop = activeRow.offsetTop - 30;
  }

  // Horizontal scroll
  if (activeCell.offsetLeft + activeRow.clientWidth + 30
    > (container.scrollLeft + container.clientWidth)) {
    const offsetValue: number = container.getBoundingClientRect().right
      - activeCell.getBoundingClientRect().right - 30;
    container.scrollLeft -= offsetValue;
  } else if (activeCell.offsetLeft - 30 < container.scrollLeft) {
    container.scrollLeft = activeCell.offsetLeft - 30;
  }
}

export class Display {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  private recordsData: RecordsData;

  private columnPositionMapUnsubscriber: Unsubscriber;

  horizontalScrollOffset: Writable<number>;

  columnPositionMap: Writable<ColumnPositionMap>;

  activeCell: Writable<ActiveCell | undefined>;

  rowWidth: Writable<number>;

  displayableRecords: Readable<TableRecord[]>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    recordsData: RecordsData,
  ) {
    this.type = type;
    this.parentId = parentId;
    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.recordsData = recordsData;
    this.horizontalScrollOffset = writable(0);
    this.columnPositionMap = writable(new Map() as ColumnPositionMap);
    this.activeCell = writable<ActiveCell | undefined>(undefined);
    this.rowWidth = writable(0);

    // subscribers
    this.columnPositionMapUnsubscriber = this.columnsDataStore.subscribe((columnData) => {
      this.columnPositionMap.update(
        (map) => recalculateColumnPositions(map, columnData.columns),
      );
      const width = get(this.columnPositionMap).get('__row')?.width;
      const widthWithPadding = width ? width + DEFAULT_ROW_RIGHT_PADDING : 0;
      this.rowWidth.set(widthWithPadding);
    });

    const { savedRecords, newRecords } = this.recordsData;
    this.displayableRecords = derived(
      [savedRecords, newRecords],
      ([$savedRecords, $newRecords], set) => {
        let allRecords = $savedRecords;
        if ($newRecords.length > 0) {
          allRecords = allRecords.concat({
            __identifier: '__new_help_text',
            __isNewHelpText: true,
            __state: States.Done,
          }).concat($newRecords);
        }
        allRecords = allRecords.concat({
          ...this.recordsData.getNewEmptyRecord(),
          __isAddPlaceholder: true,
        });
        set(allRecords);
      },
    );
  }

  resetActiveCell(): void {
    this.activeCell.set(undefined);
  }

  selectCell(row: TableRecord, column: Column): void {
    this.activeCell.set({
      rowIndex: row.__rowIndex,
      columnIndex: column.__columnIndex,
      type: 'select',
    });
  }

  editCell(row: TableRecord, column: Column): void {
    if (!column.primary_key) {
      this.activeCell.set({
        rowIndex: row.__rowIndex,
        columnIndex: column.__columnIndex,
        type: 'edit',
      });
    }
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent['key']): 'moved' | 'changed' | undefined {
    const { columns } = this.columnsDataStore.get();
    const totalCount = get(this.recordsData.totalCount);
    const savedRecords = get(this.recordsData.savedRecords);
    const newRecords = get(this.recordsData.newRecords);
    const offset = get(this.meta.offset);
    const pageSize = get(this.meta.pageSize);
    const minRowIndex = 0;
    const maxRowIndex = Math.min(
      pageSize,
      totalCount - offset,
      savedRecords.length,
    ) + newRecords.length;
    const activeCell = get(this.activeCell);

    if (movementKeys.has(key) && activeCell?.type === 'select') {
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

    if (key === 'Tab' && activeCell?.type === 'edit') {
      this.activeCell.update((existing) => {
        if (!existing) {
          return undefined;
        }
        const newActiveCell = { ...existing };
        if (existing.columnIndex < columns.length - 1) {
          newActiveCell.columnIndex += 1;
        }
        return newActiveCell;
      });
      return 'moved';
    }

    if (key === 'Enter') {
      if (activeCell?.type === 'select') {
        if (!columns[activeCell.columnIndex]?.primary_key) {
          this.activeCell.update(
            (existing) => (existing ? { ...existing, type: 'edit' } : undefined),
          );
          return 'changed';
        }
      } else if (activeCell?.type === 'edit') {
        this.activeCell.update(
          (existing) => (existing ? { ...existing, type: 'select' } : undefined),
        );
        return 'changed';
      }
    }

    if (key === 'Escape' && activeCell?.type === 'edit') {
      this.activeCell.update(
        (existing) => (existing ? { ...existing, type: 'select' } : undefined),
      );
      return 'changed';
    }

    return undefined;
  }

  destroy(): void {
    this.columnPositionMapUnsubscriber();
  }
}
