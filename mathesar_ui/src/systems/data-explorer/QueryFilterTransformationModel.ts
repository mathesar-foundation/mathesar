import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { QueryInstanceFilterTransformation } from '@mathesar/api/rpc/explorations';
import { validateFilterEntry } from '@mathesar/components/filter-entry';
import { getLimitedFilterInformationById } from '@mathesar/stores/abstract-types';
import type { FilterId } from '@mathesar/stores/abstract-types/types';

export interface QueryFilterTransformationEntry {
  columnIdentifier: string;
  conditionIdentifier: FilterId;
  value: unknown;
}

export default class QueryFilterTransformationModel
  implements QueryFilterTransformationEntry
{
  type = 'filter' as const;

  name = get(_)('filter');

  columnIdentifier;

  conditionIdentifier: FilterId;

  value: unknown;

  constructor(
    data: QueryInstanceFilterTransformation | QueryFilterTransformationEntry,
  ) {
    if ('columnIdentifier' in data) {
      this.columnIdentifier = data.columnIdentifier;
      this.conditionIdentifier = data.conditionIdentifier;
      this.value = data.value;
    } else {
      [this.conditionIdentifier] = Object.keys(data.spec) as FilterId[];
      const filterConditionParams = data.spec[this.conditionIdentifier];
      if (!filterConditionParams) {
        throw new Error('Invalid QueryInstanceFilterTransformation');
      }
      [this.columnIdentifier] = filterConditionParams[0].column_name;
      this.value = filterConditionParams[1]?.literal[0];
    }
  }

  isValid(): boolean {
    const condition = getLimitedFilterInformationById(this.conditionIdentifier);
    if (condition) {
      return validateFilterEntry(condition, this.value);
    }
    return false;
  }

  toJson(): QueryInstanceFilterTransformation {
    return {
      type: 'filter',
      spec: {
        [this.conditionIdentifier]: [
          { column_name: [this.columnIdentifier] },
          ...(this.value !== undefined ? [{ literal: [this.value] }] : []),
        ],
      },
    };
  }

  isColumnUsedInTransformation(columnAlias: string): boolean {
    return this.columnIdentifier === columnAlias;
  }
}
