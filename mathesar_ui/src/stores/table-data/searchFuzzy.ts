import type { RecordsSearchParams } from '@mathesar/api/rpc/records';
import { normalizeColumnId } from '@mathesar/utils/columnUtils';
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

export class SearchFuzzy extends ImmutableMap<string, unknown> {
  constructor(i: Iterable<[string, unknown]> = []) {
    super(i);
    this.valueIsValid = valueIsSearchable;
  }

  getSearchParams(): RecordsSearchParams['search_params'] {
    return [...this]
      .map(([columnId, value]) => ({
        attnum: normalizeColumnId(columnId),
        literal: value,
      }))
      .filter(
        (entry): entry is { attnum: number; literal: unknown } =>
          entry.attnum !== undefined,
      );
  }
}
