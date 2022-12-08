import type { GetRequestParams } from '@mathesar/api/types/tables/records';
import { ImmutableMap } from '@mathesar/component-library';

/**
 * Due to the way that the fuzzy search works, it doesn't make sense to search
 * for empty-like values, so we strip them out.
 */
function valueIsSearchable(v: unknown) {
  if (typeof v === 'string') {
    return v.trim().length > 0;
  }
  return v !== null && v !== undefined;
}

export class SearchFuzzy extends ImmutableMap<number, unknown> {
  constructor(i: Iterable<[number, unknown]> = []) {
    super(i);
    this.valueIsValid = valueIsSearchable;
  }

  recordsRequestParams(): Pick<GetRequestParams, 'search_fuzzy'> {
    if (this.size === 0) {
      return {};
    }
    return {
      search_fuzzy: [...this].map(([columnId, value]) => ({
        field: columnId,
        literal: value,
      })),
    };
  }
}
