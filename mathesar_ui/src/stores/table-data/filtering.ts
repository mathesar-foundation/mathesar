import type {
  FilterCombination,
  GetRequestParams,
  FilterCondition,
  FilterConditionParams,
} from '@mathesar/api/types/tables/records';

export interface FilterEntry {
  readonly columnId: number;
  readonly conditionId: string;
  readonly value: unknown;
}

function makeApiFilterCondition(filterEntry: FilterEntry): FilterCondition {
  const params: FilterConditionParams = [{ column_id: [filterEntry.columnId] }];
  if (typeof filterEntry.value !== 'undefined') {
    params.push({ literal: [filterEntry.value] });
  }
  return { [filterEntry.conditionId]: params };
}

/** [ columnId, operation, value ] */
type TerseFilterEntry = [number, string, unknown];

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

  recordsRequestParams(): Pick<GetRequestParams, 'filter'> {
    if (!this.entries.length) {
      return {};
    }
    const conditions = this.entries.map(makeApiFilterCondition);
    if (conditions.length === 1) {
      return { filter: conditions[0] };
    }
    const filter =
      this.combination === 'and' ? { and: conditions } : { or: conditions };
    return { filter };
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
