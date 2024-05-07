import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { QueryInstanceHideTransformation } from '@mathesar/api/rest/types/queries';

export interface QueryHideTransformationEntry {
  columnAliases: string[];
}

export default class QueryHideTransformationModel
  implements QueryHideTransformationEntry
{
  type = 'hide' as const;

  name = get(_)('hide_columns');

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

  isValid(): boolean {
    return this.columnAliases.length > 0;
  }

  toJson(): QueryInstanceHideTransformation {
    return {
      type: this.type,
      spec: this.columnAliases,
    };
  }

  isColumnUsedInTransformation(columnAlias: string): boolean {
    return this.columnAliases.includes(columnAlias);
  }
}
