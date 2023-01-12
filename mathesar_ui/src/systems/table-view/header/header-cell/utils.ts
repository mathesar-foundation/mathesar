import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
import { SortDirection } from '@mathesar/stores/table-data';

export function getSortingLabelForColumn(
  dataType: CellDataType,
  hasFkConstraint: boolean,
): Record<SortDirection, string> {
  if (['string', 'uri'].includes(dataType) || hasFkConstraint) {
    return {
      [SortDirection.A]: 'A-Z',
      [SortDirection.D]: 'Z-A',
    };
  }

  if (['date', 'datetime', 'time'].includes(dataType)) {
    return {
      [SortDirection.A]: 'Oldest-Newest',
      [SortDirection.D]: 'Newest-Oldest',
    };
  }

  if (['number'].includes(dataType)) {
    return {
      [SortDirection.A]: '0-9',
      [SortDirection.D]: '9-0',
    };
  }

  return {
    [SortDirection.A]: 'Ascending',
    [SortDirection.D]: 'Descending',
  };
}
