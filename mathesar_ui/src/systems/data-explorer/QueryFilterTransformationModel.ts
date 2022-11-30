import type { QueryInstanceFilterTransformation } from '@mathesar/api/types/queries';

export interface QueryFilterTransformationEntry {
  columnIdentifier: string;
  conditionIdentifier: string;
  value: unknown;
}

export default class QueryFilterTransformationModel
  implements QueryFilterTransformationEntry
{
  type = 'filter' as const;

  columnIdentifier;

  conditionIdentifier;

  value: unknown;

  constructor(
    data: QueryInstanceFilterTransformation | QueryFilterTransformationEntry,
  ) {
    if ('columnIdentifier' in data) {
      this.columnIdentifier = data.columnIdentifier;
      this.conditionIdentifier = data.conditionIdentifier;
      this.value = data.value;
    } else {
      [this.conditionIdentifier] = Object.keys(data.spec);
      [this.columnIdentifier] =
        data.spec[this.conditionIdentifier][0].column_name;
      this.value = data.spec[this.conditionIdentifier][1]?.literal[0];
    }
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

  isColumnUsedInTransformation(columnAlias: string): boolean {
    return this.columnIdentifier === columnAlias;
  }
}
