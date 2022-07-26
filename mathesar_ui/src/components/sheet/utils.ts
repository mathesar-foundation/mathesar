import { setContext, getContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type { ImmutableMap } from '@mathesar-component-library/types';

export interface ColumnPosition {
  left: number;
  width: number;
  styleString: string;
}

export interface SheetContextStores<SheetColumnType, SheetColumnIdentifierKey> {
  columnStyleMap: Readable<Map<SheetColumnIdentifierKey, ColumnPosition>>;
  rowWidth: Readable<number>;
}

export interface SheetContext<SheetColumnType, SheetColumnIdentifierKey> {
  stores: SheetContextStores<SheetColumnType, SheetColumnIdentifierKey>;
  api: {
    setColumnWidth: (
      columnIdentifierKey: SheetColumnIdentifierKey,
      width: number,
    ) => void;
    getColumnWidth: (columnIdentifierKey: SheetColumnIdentifierKey) => number;
    resetColumnWidth: (columnIdentifierKey: SheetColumnIdentifierKey) => void;
  };
}

export const DEFAULT_COLUMN_WIDTH = 160;
const SHEET_CONTEXT_KEY = {};

export function calculateColumnStyleMapAndRowWidth<
  SheetColumnType,
  SheetColumnIdentifierKey,
>(
  columns: SheetColumnType[],
  getColumnIdentifier: (column: SheetColumnType) => SheetColumnIdentifierKey,
  customizedColumnWidths: ImmutableMap<SheetColumnIdentifierKey, number>,
): {
  rowWidth: number;
  columnStyleMap: Map<SheetColumnIdentifierKey, ColumnPosition>;
} {
  let left = 0;
  const map = new Map<SheetColumnIdentifierKey, ColumnPosition>();
  columns.forEach((column) => {
    const key = getColumnIdentifier(column);
    const width = customizedColumnWidths.get(key) ?? DEFAULT_COLUMN_WIDTH;
    map.set(key, {
      left,
      width,
      styleString: `width: ${width}px; left: ${left}px;`,
    });
    left += width;
  });
  return { columnStyleMap: map, rowWidth: left };
}

export function setSheetContext<SheetColumnType, SheetColumnIdentifierKey>(
  sheetContext: SheetContext<SheetColumnType, SheetColumnIdentifierKey>,
): void {
  setContext(SHEET_CONTEXT_KEY, sheetContext);
}

export function getSheetContext<
  SheetColumnType,
  SheetColumnIdentifierKey,
>(): SheetContext<SheetColumnType, SheetColumnIdentifierKey> {
  return getContext(SHEET_CONTEXT_KEY);
}
