import type { QueryInstanceHideTransformation } from '@mathesar/api/types/queries';

export interface QueryHideTransformationEntry {
  columnAliases: string[];
}

export default class QueryHideTransformationModel
  implements QueryHideTransformationEntry
{
  type = 'hide' as const;

  name = 'Hide Columns' as const;

  columnAliases: string[];

  constructor(
    data: QueryInstanceHideTransformation | QueryHideTransformationEntry,
  ) {
    if ('columnAliases' in data) {
      this.columnAliases = data.columnAliases;
    } else {
      this.columnAliases = data.spec;
    }
  }

  toJSON(): QueryInstanceHideTransformation {
    return {
      type: this.type,
      spec: this.columnAliases,
    };
  }
}
