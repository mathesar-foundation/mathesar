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
      ASCENDING: 'Ascending ID',
      DESCENDING: 'Descending ID',
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
      ASCENDING: 'Oldest-Newest',
      DESCENDING: 'Newest-Oldest',
    };
  }

  if (['number'].includes(dataType)) {
    return {
      ASCENDING: '0-9',
      DESCENDING: '9-0',
    };
  }

  return {
    ASCENDING: 'Ascending',
    DESCENDING: 'Descending',
  };
}
