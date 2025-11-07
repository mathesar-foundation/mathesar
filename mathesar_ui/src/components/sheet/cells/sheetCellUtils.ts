import { type Readable, derived } from 'svelte/store';

import { type ColumnPosition, getSheetContext } from '../utils';

export function getSheetColumnPosition<ColumnIdentifierKey>(
  columnIdentifierKey: ColumnIdentifierKey,
): Readable<ColumnPosition | undefined> {
  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;
  return derived(columnStyleMap, (map) => {
    const columnPosition = map.get(columnIdentifierKey);
    return columnPosition;
  });
}

export function getSheetCellStyle<ColumnIdentifierKey>(
  columnIdentifierKey: ColumnIdentifierKey,
): Readable<string | undefined> {
  return derived(
    getSheetColumnPosition(columnIdentifierKey),
    (p) => p?.styleString,
  );
}
