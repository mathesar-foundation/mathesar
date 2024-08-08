import type {
  RecordsListParams,
  SqlColumn,
  SqlComparison,
  SqlExpr,
  SqlFunction,
  SqlLiteral,
} from '@mathesar/api/rpc/records';

import type { FilterId } from '../abstract-types/types';

export type FilterCombination = 'and' | 'or';

export interface FilterEntry {
  readonly columnId: number;
  readonly conditionId: FilterId;
  readonly value: unknown;
}

/**
 * This function is glue code between the old filtering system (circa 2023) and
 * the new filtering system (circa 2024).
 *
 * At the API layer, the old filtering system was relatively flat and not very
 * flexible.
 *
 * The new filtering system is much more flexible and can handle complex
 * filtering expressions with arbitrary nesting. Brent introduced this new
 * system when moving the filtering logic from the service layer to the DB
 * layer. As a result, the API changed. But in an effort to minimize disturbance
 * within the front end, we introduced this compatibility layer.
 *
 * The `FilterEntry` argument to this function is a data structure from the
 * _old_ filtering system. It is consistent with the behavior of the UI and the
 * data structures used for filtering throughout the front end. The `SqlExpr`
 * return value is a data structure from the _new_ filtering system. It is
 * consistent with the behavior of the API.
 *
 * If, at some point, we'd like to design a more flexible user-facing filtering
 * UI, then we could model that UI (and the resulting front end data structures)
 * around the `SqlExpr` data structure. This would allow us to avoid the need
 * for this compatibility layer.
 */
function filterEntryToSqlExpr(filterEntry: FilterEntry): SqlExpr {
  const column: SqlColumn = { type: 'attnum', value: filterEntry.columnId };

  /** Generate an SqlLiteral value */
  function value(v = filterEntry.value): SqlLiteral {
    return { type: 'literal', value: String(v) };
  }

  /** Generate an SqlComparison */
  function cmp(
    type: SqlComparison['type'],
    args: [SqlExpr, SqlExpr] = [column, value()],
  ): SqlComparison {
    return { type, args };
  }

  /** Generate an SqlFunction */
  function fn(type: SqlFunction['type'], arg: SqlExpr = column): SqlFunction {
    return { type, args: [arg] };
  }

  /** Generate an SqlComparison of a JSON array length vs a value */
  function arrayLengthCmp(
    type: SqlComparison['type'],
    v = value(),
  ): SqlComparison {
    return cmp(type, [fn('json_array_length'), v]);
  }

  const compatibilityMap: Record<FilterId, SqlExpr> = {
    contains_case_insensitive: cmp('contains_case_insensitive'),
    email_domain_contains: cmp('contains', [fn('email_domain'), value()]),
    email_domain_equals: cmp('equal', [fn('email_domain'), value()]),
    equal: cmp('equal'),
    greater_or_equal: cmp('greater_or_equal'),
    greater: cmp('greater'),
    json_array_contains: cmp('json_array_contains'),
    json_array_length_equals: arrayLengthCmp('equal'),
    json_array_length_greater_or_equal: arrayLengthCmp('greater_or_equal'),
    json_array_length_greater_than: arrayLengthCmp('greater'),
    json_array_length_less_or_equal: arrayLengthCmp('lesser_or_equal'),
    json_array_length_less_than: arrayLengthCmp('lesser'),
    json_array_not_empty: arrayLengthCmp('greater', value(0)),
    lesser_or_equal: cmp('lesser_or_equal'),
    lesser: cmp('lesser'),
    not_null: fn('not_null'),
    null: fn('null'),
    starts_with_case_insensitive: cmp('starts_with'),
    uri_authority_contains: cmp('contains', [fn('uri_authority'), value()]),
    uri_scheme_equals: cmp('equal', [fn('uri_scheme'), value()]),
  };

  return compatibilityMap[filterEntry.conditionId];
}

/** [ columnId, operation, value ] */
type TerseFilterEntry = [number, FilterId, unknown];

function makeTerseFilterEntry(filterEntry: FilterEntry): TerseFilterEntry {
  return [filterEntry.columnId, filterEntry.conditionId, filterEntry.value];
}

function makeFilterEntry(terseFilterEntry: TerseFilterEntry): FilterEntry {
  return {
    columnId: terseFilterEntry[0],
    conditionId: terseFilterEntry[1],
    value: terseFilterEntry[2],
  };
}

export const filterCombinations: FilterCombination[] = ['and', 'or'];
export const defaultFilterCombination = filterCombinations[0];

export type TerseFiltering = [FilterCombination, TerseFilterEntry[]];

/**
 * The data structure here is designed to model the behavior of the UI, however
 * the API has a different (and much more flexible structure). When we first
 * wrote this code, the UI and the API had similar structures, so the structure
 * used in this class fit well with both. However, now that the API has changed,
 * it might be worth using the (more flexible) data structure within this class
 * should the need ever arise for any substantial refactoring here.
 */
export class Filtering {
  combination: FilterCombination;

  entries: FilterEntry[];

  constructor({
    combination,
    entries,
  }: {
    combination?: FilterCombination;
    entries?: FilterEntry[];
  } = {}) {
    this.combination = combination ?? defaultFilterCombination;
    this.entries = entries ?? [];
  }

  withEntries(entries: Iterable<FilterEntry>): Filtering {
    return new Filtering({
      combination: this.combination,
      entries: [...this.entries, ...entries],
    });
  }

  withEntry(entry: FilterEntry): Filtering {
    return this.withEntries([entry]);
  }

  withoutEntry(entryIndex: number): Filtering {
    return new Filtering({
      combination: this.combination,
      entries: [
        ...this.entries.slice(0, entryIndex),
        ...this.entries.slice(entryIndex + 1),
      ],
    });
  }

  withoutColumns(columnIds: number[]): Filtering {
    return new Filtering({
      combination: this.combination,
      entries: this.entries.filter(
        (entry) => !columnIds.includes(entry.columnId),
      ),
    });
  }

  withCombination(combination: FilterCombination): Filtering {
    return new Filtering({
      combination,
      entries: this.entries,
    });
  }

  equals(filtering: Filtering): boolean {
    if (
      this.entries.length !== filtering.entries.length ||
      this.combination !== filtering.combination
    ) {
      return false;
    }
    for (
      let entryIndex = 0;
      entryIndex < filtering.entries.length;
      entryIndex += 1
    ) {
      const currentEntry = this.entries[entryIndex];
      const comparedEntry = filtering.entries[entryIndex];
      if (
        currentEntry.columnId !== comparedEntry.columnId ||
        currentEntry.conditionId !== comparedEntry.conditionId ||
        currentEntry.value !== comparedEntry.value
      ) {
        return false;
      }
    }
    return true;
  }

  recordsRequestParams(): Pick<RecordsListParams, 'filter'> {
    if (this.entries.length === 0) {
      return {};
    }
    if (this.entries.length === 1) {
      return { filter: filterEntryToSqlExpr(this.entries[0]) };
    }

    let expr = filterEntryToSqlExpr(this.entries[0]);
    for (let i = 1; i < this.entries.length; i += 1) {
      expr = {
        type: this.combination,
        args: [expr, filterEntryToSqlExpr(this.entries[i])],
      };
    }

    return { filter: expr };
  }

  terse(): TerseFiltering {
    return [this.combination, this.entries.map(makeTerseFilterEntry)];
  }

  static fromTerse(terse: TerseFiltering): Filtering {
    return new Filtering({
      combination:
        filterCombinations.find((c) => c === terse[0]) ??
        defaultFilterCombination,
      entries: terse[1].map(makeFilterEntry),
    });
  }
}
