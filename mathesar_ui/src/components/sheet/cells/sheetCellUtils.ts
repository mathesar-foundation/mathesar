import { type Readable, derived } from 'svelte/store';

import { getSheetContext } from '../utils';

export function getSheetCellStyle<ColumnIdentifierKey>(
  columnIdentifierKey: ColumnIdentifierKey,
): Readable<string | undefined> {
  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;
  return derived(columnStyleMap, (map) => {
    const columnPosition = map.get(columnIdentifierKey);
    return columnPosition?.styleString;
  });
}
