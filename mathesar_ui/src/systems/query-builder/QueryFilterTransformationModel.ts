import type { QueryInstanceFilterTransformation } from '@mathesar/api/queries/queryList';

export interface QueryFilterTransformationEntry {
  columnIdentifier: string;
  conditionIdentifier: string;
  value: unknown;
}

export default class QueryFilterTransformationModel
  implements QueryFilterTransformationEntry
{
  columnIdentifier;

  conditionIdentifier;

  value: unknown;

  constructor(
    data: QueryInstanceFilterTransformation | QueryFilterTransformationEntry,
  ) {
    if ('columnIdentifier' in data) {
      this.columnIdentifier = data.columnIdentifier;
      this.conditionIdentifier = data.conditionIdentifier;
    } else {
      [this.conditionIdentifier] = Object.keys(data.spec);
      [this.columnIdentifier] =
        data.spec[this.conditionIdentifier][0].column_name;
    }
  }

  toJSON(): QueryInstanceFilterTransformation {
    return {
      type: 'filter',
      spec: {
        [this.conditionIdentifier]: [
          { column_name: [this.columnIdentifier] },
          { literal: [this.value] },
        ],
      },
    };
  }
}
