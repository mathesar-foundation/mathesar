import { writable, get, derived } from 'svelte/store';
import { States } from '@mathesar/utils/api';
import type { Writable, Readable, Unsubscriber } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';
import type { Meta } from './meta';
import type { Columns, TableColumn } from './columns';
import type { TableRecord, Records } from './records';

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

function recalculateColumnPositions(columnPositionMap: ColumnPositionMap, columns: TableColumn[]) {
  let left = ROW_CONTROL_COLUMN_WIDTH;
  const newColumnPositionMap: ColumnPositionMap = new Map(columnPositionMap);
  columns.forEach((column) => {
    const columnWidth = newColumnPositionMap.get(column.name)?.width;
    if (typeof columnWidth !== 'number') {
      newColumnPositionMap.set(column.name, {
        left,
        width: DEFAULT_COLUMN_WIDTH,
      });
      left += DEFAULT_COLUMN_WIDTH;
    } else {
      left += columnWidth;
    }
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
  column: TableColumn,
): boolean {
  return activeCell
    && activeCell?.columnIndex === column.__columnIndex
    && activeCell.rowIndex === row.__rowIndex;
}

export function isCellBeingEdited(
  activeCell: ActiveCell,
  row: TableRecord,
  column: TableColumn,
): boolean {
  return isCellActive(activeCell, row, column) && activeCell.type === 'edit';
}

// TODO: Create a common utility action to handle active element based scroll
export function scrollBasedOnActiveCell(): void {
  const activeCell: HTMLElement = document.querySelector('.cell.is-active');
  const activeRow = activeCell?.parentElement;
  const container = document.querySelector('.virtual-list.outerElement');
  if (container && activeRow) {
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
}

export class Display {
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  _meta: Meta;

  _columns: Columns;

  _records: Records;

  _columnPositionMapUnsubscriber: Unsubscriber;

  showDisplayOptions: Writable<boolean>;

  horizontalScrollOffset: Writable<number>;

  columnPositionMap: Writable<ColumnPositionMap>;

  activeCell: Writable<ActiveCell>;

  rowWidth: Writable<number>;

  displayableRecords: Readable<TableRecord[]>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    columns: Columns,
    records: Records,
  ) {
    this._type = type;
    this._parentId = parentId;
    this._meta = meta;
    this._columns = columns;
    this._records = records;
    this.showDisplayOptions = writable(false);
    this.horizontalScrollOffset = writable(0);
    this.columnPositionMap = writable(new Map() as ColumnPositionMap);
    this.activeCell = writable(null as ActiveCell);
    this.rowWidth = writable(0);

    // subscribers
    this._columnPositionMapUnsubscriber = this._columns.subscribe((columnData) => {
      this.columnPositionMap.update(
        (map) => recalculateColumnPositions(map, columnData.data),
      );
      const width = get(this.columnPositionMap).get('__row')?.width;
      const widthWithPadding = width ? width + DEFAULT_ROW_RIGHT_PADDING : 0;
      this.rowWidth.set(widthWithPadding);
    });

    const { savedRecords, newRecords } = this._records;
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
          ...this._records.getNewEmptyRecord(),
          __isAddPlaceholder: true,
        });
        set(allRecords);
      },
    );
  }

  resetActiveCell(): void {
    this.activeCell.set(null as ActiveCell);
  }

  selectCell(row: TableRecord, column: TableColumn): void {
    this.activeCell.set({
      rowIndex: row.__rowIndex,
      columnIndex: column.__columnIndex,
      type: 'select',
    });
  }

  editCell(row: TableRecord, column: TableColumn): void {
    if (!column.primary_key) {
      this.activeCell.set({
        rowIndex: row.__rowIndex,
        columnIndex: column.__columnIndex,
        type: 'edit',
      });
    }
  }

  handleKeyEventsOnActiveCell(key: KeyboardEvent['key']): 'moved' | 'changed' | null {
    const columnData = this._columns.get().data;
    const totalCount = get(this._records.totalCount);
    const savedRecords = get(this._records.savedRecords);
    const newRecords = get(this._records.newRecords);
    const offset = get(this._meta.offset);
    const pageSize = get(this._meta.pageSize);
    const minRowIndex = 0;
    const maxRowIndex = Math.min(
      pageSize,
      totalCount - offset,
      savedRecords.length,
    ) + newRecords.length - 1;
    const activeCell = get(this.activeCell);

    if (movementKeys.has(key) && activeCell?.type === 'select') {
      this.activeCell.update((existing) => {
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
            if (existing.columnIndex < columnData.length - 1) {
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
        const newActiveCell = { ...existing };
        if (existing.columnIndex < columnData.length - 1) {
          newActiveCell.columnIndex += 1;
        }
        return newActiveCell;
      });
      return 'moved';
    }

    if (key === 'Enter') {
      if (activeCell?.type === 'select') {
        if (!columnData[activeCell.columnIndex]?.primary_key) {
          this.activeCell.update((existing) => ({
            ...existing,
            type: 'edit',
          }));
          return 'changed';
        }
      } else if (activeCell?.type === 'edit') {
        this.activeCell.update((existing) => ({
          ...existing,
          type: 'select',
        }));
        return 'changed';
      }
    }

    if (key === 'Escape' && activeCell?.type === 'edit') {
      this.activeCell.update((existing) => ({
        ...existing,
        type: 'select',
      }));
      return 'changed';
    }

    return null;
  }

  destroy(): void {
    this._columnPositionMapUnsubscriber();
  }
}
