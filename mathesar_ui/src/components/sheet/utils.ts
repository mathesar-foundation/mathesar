import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';

import {
  DEFAULT_COLUMN_WIDTH_PX,
  MAX_COLUMN_WIDTH_PX,
  MIN_COLUMN_WIDTH_PX,
} from '@mathesar/geometry';
import type { ImmutableMap } from '@mathesar-component-library/types';

export interface ColumnPosition {
  left: number;
  width: number;
  styleString: string;
}

export interface SheetContextStores {
  columnStyleMap: Readable<Map<string, ColumnPosition>>;
  rowWidth: Readable<number>;
  horizontalScrollOffset: Readable<number>;
  scrollOffset: Readable<number>;
  paddingRight: Readable<number>;
  selectionInProgress: Readable<boolean>;
}

export interface SheetContext {
  stores: SheetContextStores;
  api: {
    setColumnWidth: (columnIdentifierKey: string, width: number) => void;
    getColumnWidth: (columnIdentifierKey: string) => number;
    resetColumnWidth: (columnIdentifierKey: string) => void;
    setHorizontalScrollOffset: (offset: number) => void;
    setScrollOffset: (offset: number) => void;
  };
}

const SHEET_CONTEXT_KEY = {};

export function normalizeColumnWidth(width: number | undefined): number {
  if (!width) return DEFAULT_COLUMN_WIDTH_PX;
  return Math.max(MIN_COLUMN_WIDTH_PX, Math.min(MAX_COLUMN_WIDTH_PX, width));
}

export function calculateColumnStyleMapAndRowWidth<SheetColumnType>(
  columns: SheetColumnType[],
  getColumnIdentifier: (column: SheetColumnType) => string,
  customizedColumnWidths: ImmutableMap<string, number>,
  paddingRight: number,
): {
  rowWidth: number;
  columnStyleMap: Map<string, ColumnPosition>;
} {
  let left = 0;
  const map = new Map<string, ColumnPosition>();
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

export function setSheetContext(sheetContext: SheetContext): void {
  setContext(SHEET_CONTEXT_KEY, sheetContext);
}

export function getSheetContext(): SheetContext {
  return getContext(SHEET_CONTEXT_KEY);
}

export function focusActiveCell(sheetElement: HTMLElement): void {
  sheetElement?.querySelector<HTMLElement>('[data-active-cell]')?.focus();
}
