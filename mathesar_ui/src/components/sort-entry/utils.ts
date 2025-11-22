import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { CellDataType } from '../cell-fabric/data-types/typeDefinitions';

export type SortDirection = 'ASCENDING' | 'DESCENDING';

export const allowedSortDirections: SortDirection[] = [
  'ASCENDING',
  'DESCENDING',
];

export function getSortingLabelForColumn(
  dataType: CellDataType,
  hasFkConstraint?: boolean,
): Record<SortDirection, string> {
  if (hasFkConstraint) {
    return {
      ASCENDING: get(_)('ascending_id'),
      DESCENDING: get(_)('descending_id'),
    };
  }

  if (['string', 'uri'].includes(dataType)) {
    return {
      ASCENDING: 'A-Z',
      DESCENDING: 'Z-A',
    };
  }

  if (['date', 'datetime', 'time'].includes(dataType)) {
    return {
      ASCENDING: get(_)('oldest_to_newest_sort'),
      DESCENDING: get(_)('newest_to_oldest_sort'),
    };
  }

  if (['number'].includes(dataType)) {
    return {
      ASCENDING: '0-9',
      DESCENDING: '9-0',
    };
  }

  return {
    ASCENDING: get(_)('ascending'),
    DESCENDING: get(_)('descending'),
  };
}
