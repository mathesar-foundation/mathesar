import { setContext, getContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type { ImmutableMap } from '@mathesar-component-library/types';

export interface ColumnPosition {
  left: number;
  width: number;
  styleString: string;
}

export interface SheetContextStores<SheetColumnIdentifierKey> {
  columnStyleMap: Readable<Map<SheetColumnIdentifierKey, ColumnPosition>>;
  rowWidth: Readable<number>;
  horizontalScrollOffset: Readable<number>;
  scrollOffset: Readable<number>;
}

export interface SheetContext<SheetColumnIdentifierKey> {
  stores: SheetContextStores<SheetColumnIdentifierKey>;
  api: {
    setColumnWidth: (
      columnIdentifierKey: SheetColumnIdentifierKey,
      width: number,
    ) => void;
    getColumnWidth: (columnIdentifierKey: SheetColumnIdentifierKey) => number;
    resetColumnWidth: (columnIdentifierKey: SheetColumnIdentifierKey) => void;
    setHorizontalScrollOffset: (offset: number) => void;
    setScrollOffset: (offset: number) => void;
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

export function setSheetContext<SheetColumnIdentifierKey>(
  sheetContext: SheetContext<SheetColumnIdentifierKey>,
): void {
  setContext(SHEET_CONTEXT_KEY, sheetContext);
}

export function getSheetContext<
  SheetColumnIdentifierKey,
>(): SheetContext<SheetColumnIdentifierKey> {
  return getContext(SHEET_CONTEXT_KEY);
}
