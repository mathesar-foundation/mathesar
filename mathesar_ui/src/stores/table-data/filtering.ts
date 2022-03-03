import type { SelectOption } from '@mathesar-component-library/types';
import type {
  FilterCombination as ApiFilterCombination,
  GetRequestParams,
  FilterOperation,
  FilterCondition as ApiFilterCondition,
} from '@mathesar/api/tables/records';

export interface FilterCondition {
  id: FilterOperation;
  label: string;
}

export const filterConditions: FilterCondition[] = [
  { id: 'eq', label: 'equals' },
  { id: 'ne', label: 'not equals' },
  { id: 'get_duplicates', label: 'has duplicates' },
];

export const defaultFilterCondition = filterConditions[0];

export interface FilterEntry {
  readonly columnName: string;
  readonly condition: FilterCondition;
  readonly value: string;
}

function makeApiFilterCondition(filterEntry: FilterEntry): ApiFilterCondition {
  return {
    field: filterEntry.columnName,
    op: filterEntry.condition.id,
    value: filterEntry.value,
  };
}

/** [ columnName, operation, value ] */
type TerseFilterEntry = [string, FilterOperation, string];

function makeTerseFilterEntry(filterEntry: FilterEntry): TerseFilterEntry {
  return [filterEntry.columnName, filterEntry.condition.id, filterEntry.value];
}

function makeFilterEntry(terseFilterEntry: TerseFilterEntry): FilterEntry {
  const filterOperation = terseFilterEntry[1];
  let condition = filterConditions.find((c) => c.id === filterOperation);
  if (!condition) {
    console.error(`Unknown filter operation ${filterOperation}.`);
    condition = defaultFilterCondition;
  }
  return {
    columnName: terseFilterEntry[0],
    condition,
    value: terseFilterEntry[2],
  };
}

export interface FilterCombination extends SelectOption {
  readonly id: ApiFilterCombination;
  readonly label: string;
}

export const filterCombinations: FilterCombination[] = [
  { id: 'and', label: 'and' },
  { id: 'or', label: 'or' },
];
export const defaultFilterCombination = filterCombinations[0];

export type TerseFiltering = [ApiFilterCombination, TerseFilterEntry[]];

export class Filtering {
  readonly combination: FilterCombination;

  readonly entries: FilterEntry[];

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

  withEntry(entry: FilterEntry): Filtering {
    return new Filtering({
      combination: this.combination,
      entries: [...this.entries, entry],
    });
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

  withCombination(combination: FilterCombination): Filtering {
    return new Filtering({
      combination,
      entries: this.entries,
    });
  }

  recordsRequestParams(): Pick<GetRequestParams, 'filters'> {
    if (!this.entries.length) {
      return {};
    }
    const conditions = this.entries.map(makeApiFilterCondition);

    if (
      this.combination.id === 'and' &&
      this.entries.length === 1 &&
      this.entries[0].condition.id === 'get_duplicates'
    ) {
      // Special handling for the get_duplicates operation due to backend bug.
      // The backend can only handle the get_duplicates operation by itself. The
      // "and" must be removed and the value must be in an array.
      conditions[0].value = [conditions[0].value];
      return { filters: conditions };
    }

    const filters =
      this.combination.id === 'and' ? { and: conditions } : { or: conditions };
    return { filters };
  }

  terse(): TerseFiltering {
    return [this.combination.id, this.entries.map(makeTerseFilterEntry)];
  }

  static fromTerse(terse: TerseFiltering): Filtering {
    return new Filtering({
      combination:
        filterCombinations.find((c) => c.id === terse[0]) ??
        defaultFilterCombination,
      entries: terse[1].map(makeFilterEntry),
    });
  }
}
