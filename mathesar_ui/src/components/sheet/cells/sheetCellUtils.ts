import { type Readable, derived } from 'svelte/store';

import { type ColumnPosition, getSheetContext } from '../utils';

export function getSheetColumnPosition(
  columnIdentifierKey: string,
): Readable<ColumnPosition | undefined> {
  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;
  return derived(columnStyleMap, (map) => {
    const columnPosition = map.get(columnIdentifierKey);
    return columnPosition;
  });
}

export function getSheetCellStyle(
  columnIdentifierKey: string,
): Readable<string | undefined> {
  return derived(
    getSheetColumnPosition(columnIdentifierKey),
    (p) => p?.styleString,
  );
}
