import { writable, get } from 'svelte/store';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';
import type { Meta } from './meta';
import type { Columns, TableColumn } from './columns';
import type { TableRecord } from './records';

export interface ColumnPosition {
  width: number,
  left: number
}
export type ColumnPositionMap = Map<string, ColumnPosition>;

// TODO: Select active cell using primary key instead of index
// Checkout scenarios with pk consisting multiple columns
export interface ActiveCell {
  rowIndex: number,
  column: string,
  type: 'select' | 'edit'
}

export const ROW_CONTROL_COLUMN_WIDTH = 70;
export const GROUP_MARGIN_LEFT = 30;
export const DEFAULT_ROW_RIGHT_PADDING = 100;
export const DEFAULT_COLUMN_WIDTH = 160;

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
    && activeCell?.column === column.name
    && activeCell.rowIndex === row.__rowIndex;
}

export function isCellBeingEdited(
  activeCell: ActiveCell,
  row: TableRecord,
  column: TableColumn,
): boolean {
  return isCellActive(activeCell, row, column) && activeCell.type === 'edit';
}

export class Display {
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  _meta: Meta;

  _columns: Columns;

  _columnPositionMapUnsubscriber: Unsubscriber;

  showDisplayOptions: Writable<boolean>;

  horizontalScrollOffset: Writable<number>;

  columnPositionMap: Writable<ColumnPositionMap>;

  activeCell: Writable<ActiveCell>;

  rowWidth: Writable<number>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    columns: Columns,
  ) {
    this._type = type;
    this._parentId = parentId;
    this._meta = meta;
    this._columns = columns;
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
  }

  resetActiveCell(): void {
    this.activeCell.set(null as ActiveCell);
  }

  selectCell(row: TableRecord, column: TableColumn): void {
    this.activeCell.set({
      rowIndex: row.__rowIndex,
      column: column.name,
      type: 'select',
    });
  }

  editCell(row: TableRecord, column: TableColumn): void {
    if (!column.primary_key) {
      this.activeCell.set({
        rowIndex: row.__rowIndex,
        column: column.name,
        type: 'edit',
      });
    }
  }

  destroy(): void {
    this._columnPositionMapUnsubscriber();
  }
}
