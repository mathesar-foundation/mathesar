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

  // eslint-disable-next-line class-methods-use-this
  isValid(): boolean {
    return true;
  }

  toJSON(): QueryInstanceFilterTransformation {
    const spec: QueryInstanceFilterTransformation['spec'] = {
      [this.conditionIdentifier]: [{ column_name: [this.columnIdentifier] }],
    };
    if (typeof this.value !== 'undefined') {
      spec[this.conditionIdentifier].push({ literal: [this.value] });
    }
    return {
      type: 'filter',
      spec,
    };
  }
}
