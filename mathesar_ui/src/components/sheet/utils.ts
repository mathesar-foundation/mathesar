import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';

import {
  defaultColumnWidthPx,
  maxColumnWidthPx,
  minColumnWidthPx,
} from '@mathesar/geometry';
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
  paddingRight: Readable<number>;
  selectionInProgress: Readable<boolean>;
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

const SHEET_CONTEXT_KEY = {};

export function normalizeColumnWidth(width: number | undefined): number {
  if (!width) return defaultColumnWidthPx;
  return Math.max(minColumnWidthPx, Math.min(maxColumnWidthPx, width));
}

export function calculateColumnStyleMapAndRowWidth<
  SheetColumnType,
  SheetColumnIdentifierKey,
>(
  columns: SheetColumnType[],
  getColumnIdentifier: (column: SheetColumnType) => SheetColumnIdentifierKey,
  customizedColumnWidths: ImmutableMap<SheetColumnIdentifierKey, number>,
  paddingRight: number,
): {
  rowWidth: number;
  columnStyleMap: Map<SheetColumnIdentifierKey, ColumnPosition>;
} {
  let left = 0;
  const map = new Map<SheetColumnIdentifierKey, ColumnPosition>();
  columns.forEach((column) => {
    const key = getColumnIdentifier(column);
    const width = normalizeColumnWidth(customizedColumnWidths.get(key));
    map.set(key, {
      left,
      width,
      styleString: `width: ${width}px; left: ${left}px;`,
    });
    left += width;
  });
  const rowWidth = left + paddingRight;
  return { columnStyleMap: map, rowWidth };
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

export function focusActiveCell(sheetElement: HTMLElement): void {
  sheetElement?.querySelector<HTMLElement>('[data-active-cell]')?.focus();
}
