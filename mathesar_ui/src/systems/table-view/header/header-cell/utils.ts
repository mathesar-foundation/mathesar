import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
import type { SortDirection } from '@mathesar/components/sort-entry/utils';

export function getSortingLabelForColumn(
  dataType: CellDataType,
  hasFkConstraint: boolean,
): Record<SortDirection, string> {
  if (['string', 'uri'].includes(dataType) || hasFkConstraint) {
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
