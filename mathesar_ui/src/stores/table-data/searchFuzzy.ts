import type { RecordsSearchParams } from '@mathesar/api/rpc/records';
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

  getSearchParams(): RecordsSearchParams['search_params'] {
    return [...this].map(([columnId, value]) => ({
      attnum: columnId,
      literal: value,
    }));
  }
}
