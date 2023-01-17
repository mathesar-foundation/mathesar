import type { QueryInstanceSortTransformation } from '@mathesar/api/types/queries';
import type { SortDirection } from '@mathesar/components/sort-entry/utils';

export interface QuerySortTransformationEntry {
  columnIdentifier: string;
  sortDirection: SortDirection;
}

export default class QuerySortTransformationModel
  implements QuerySortTransformationEntry
{
  type = 'order' as const;

  name = 'Sort' as const;

  columnIdentifier;

  sortDirection: QuerySortTransformationEntry['sortDirection'];

  isValid = () => true;

  constructor(
    data: QueryInstanceSortTransformation | QuerySortTransformationEntry,
  ) {
    if ('columnIdentifier' in data) {
      this.columnIdentifier = data.columnIdentifier;
      this.sortDirection = data.sortDirection;
    } else {
      this.columnIdentifier = data.spec[0].field;
      this.sortDirection =
        data.spec[0].direction === 'desc' ? 'DESCENDING' : 'ASCENDING';
    }
  }

  toJson(): QueryInstanceSortTransformation {
    return {
      type: this.type,
      spec: [
        {
          field: this.columnIdentifier,
          direction: this.sortDirection === 'DESCENDING' ? 'desc' : 'asc',
        },
      ],
    };
  }
}
