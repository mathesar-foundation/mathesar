import type { QueryInstanceFilterTransformation } from '@mathesar/api/queries/queryList';

export interface QueryFilterTransformationEntry {
  columnIdentifiter: string;
  conditionIdentifier: string;
  value: unknown;
}

export default class QueryFilterTransformationModel
  implements QueryFilterTransformationEntry
{
  transformation: QueryInstanceFilterTransformation;

  columnIdentifiter;

  conditionIdentifier;

  value: unknown;

  constructor(
    data: QueryInstanceFilterTransformation | QueryFilterTransformationEntry,
  ) {
    if ('columnIdentifiter' in data) {
      this.columnIdentifiter = data.columnIdentifiter;
      this.conditionIdentifier = data.conditionIdentifier;
      this.transformation = {
        type: 'filter',
        spec: {
          [data.conditionIdentifier]: [
            { column_name: [data.columnIdentifiter] },
            { literal: [data.value] },
          ],
        },
      };
    } else {
      [this.conditionIdentifier] = Object.keys(data.spec);
      [this.columnIdentifiter] =
        data.spec[this.conditionIdentifier][0].column_name;
      this.transformation = data;
    }
  }

  toJSON(): QueryInstanceFilterTransformation {
    return this.transformation;
  }
}
