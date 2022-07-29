import type { GetRequestParams } from '@mathesar/api/tables/records';
import { ImmutableMap } from '@mathesar/component-library';

/**
 * Due to the way that the fuzzy search works, it doesn't make sense to search
 * for empty-like values, so we strip them out.
 */
function valueIsSearchable(v: unknown) {
  return v !== '' && v !== null && v !== undefined;
}

export class SearchFuzzy extends ImmutableMap<number, unknown> {
  recordsRequestParams(): Pick<GetRequestParams, 'search_fuzzy'> {
    const searchableEntries = [...this].filter(([, v]) => valueIsSearchable(v));
    if (!searchableEntries.length) {
      return {};
    }
    return {
      search_fuzzy: searchableEntries.map(([columnId, value]) => ({
        field: columnId,
        literal: value,
      })),
    };
  }
}
