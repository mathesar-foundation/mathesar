import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';
import type { SelectOption } from '@mathesar-components/types';

export const DEFAULT_PAGE_SIZE = 500;
export const GROUP_MARGIN_LEFT = 30;
export const ROW_CONTROL_COLUMN_WIDTH = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;

export type SortOption = Map<string, 'asc' | 'desc'>;

export type GroupOption = Set<string>;

export interface FilterEntry {
  column: SelectOption,
  condition: SelectOption,
  value: string
}

export interface FilterCombination extends SelectOption {
  id: 'and' | 'or',
  label: string
}

export const filterCombinations: FilterCombination[] = [
  { id: 'and', label: 'and' },
  { id: 'or', label: 'or' },
];

export interface FilterOption {
  combination: FilterCombination,
  filters: FilterEntry[]
}

export interface ColumnPosition {
  width: number,
  left: number
}
export type ColumnPositionMap = Map<string, ColumnPosition>;

export class Meta {
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  pageSize: Writable<number>;

  page: Writable<number>;

  offset: Readable<number>;

  sort: Writable<SortOption>;

  group: Writable<GroupOption>;

  filter: Writable<FilterOption>;

  selected: Writable<Record<string | number, boolean>>;

  selectedRecords: Readable<string[]>;

  recordRequestParams: Readable<string>;

  constructor(
    type: TabularType,
    parentId: number,
  ) {
    this._type = type;
    this._parentId = parentId;

    this.pageSize = writable(DEFAULT_PAGE_SIZE);
    this.page = writable(1);
    this.sort = writable(new Map() as SortOption);
    this.group = writable(new Set() as GroupOption);
    this.filter = writable(null as FilterOption);
    this.selected = writable({});

    this.offset = derived([this.pageSize, this.page], ([$pageSize, $page], set) => {
      set($pageSize * ($page - 1));
    });
    this.selectedRecords = derived(this.selected, ($selected, set) => {
      const pks = Object.keys($selected).filter((key) => $selected[key]);
      set(pks);
    });
    this._setRecordRequestParamsStore();
  }

  _setRecordRequestParamsStore(): void {
    this.recordRequestParams = derived(
      [
        this.pageSize,
        this.offset,
        this.group,
        this.sort,
        this.filter,
      ],
      (
        [$pageSize, $offset, $group, $sort, $filter],
        set,
      ) => {
        const params: string[] = [];
        params.push(`limit=${$pageSize}`);
        params.push(`offset=${$offset}`);

        const groupOptions = Array.from($group ?? []);
        const groupSortOptions = groupOptions.map((field) => ({
          field,
          direction: $sort.get(field) ?? 'asc',
        }));

        let sortOptions: { 'field': string, 'direction': string }[] = [];
        $sort.forEach((value, key) => {
          if (!$group.has(key)) {
            sortOptions.unshift({
              field: key,
              direction: value,
            });
          }
        });

        sortOptions = [...groupSortOptions, ...sortOptions];

        if (sortOptions.length > 0) {
          params.push(`order_by=${encodeURIComponent(JSON.stringify(sortOptions))}`);
        }
        if (groupOptions.length > 0) {
          params.push(
            `group_count_by=${encodeURIComponent(JSON.stringify(groupOptions))}`,
          );
        }
        if ($filter.filters?.length > 0) {
          const filter = {};
          const terms = $filter.filters.map((term) => ({
            field: term.column.id,
            op: term.condition.id,
            value: term.value,
          }));
          filter[$filter.combination.id as string] = terms;
          params.push(
            `filters=${encodeURIComponent(JSON.stringify(filter))}`,
          );
        }
        set(params.join('&'));
      },
    );
  }

  clearSelectedRecords(): void {
    this.selected.set({});
  }

  addFilter(entry: FilterEntry, combination?: FilterCombination): void {
    this.filter.update((existing) => ({
      combination: combination || existing.combination || filterCombinations[0],
      filters: [
        ...existing.filters,
        entry,
      ],
    }));
  }

  removeFilter(index: number): void {
    this.filter.update((existing) => {
      existing?.filters?.splice(index, 1);
      return {
        ...existing,
      };
    });
  }

  setFilterCombination(combination: FilterCombination): void {
    this.filter.update((existing) => ({
      ...existing,
      combination,
    }));
  }

  getFilterCombination(): FilterCombination {
    return get(this.filter)?.combination ?? filterCombinations[0];
  }

  setFilters(filters: FilterOption): void {
    this.filter.set(filters);
  }

  addUpdateSort(column: string, direction: 'asc' | 'desc' = 'asc'): void {
    this.sort.update((existing) => {
      const newSort: SortOption = new Map(existing);
      newSort.set(column, direction);
      return newSort;
    });
  }

  removeSort(column: string): void {
    this.sort.update((existing) => {
      const newSort = new Map(existing);
      newSort.delete(column);
      return newSort;
    });
  }

  changeSortDirection(column: string, direction: 'asc' | 'desc'): void {
    if (get(this.sort).get(column) !== direction) {
      this.sort.update((existing) => {
        const newSort = new Map(existing);
        newSort.set(column, direction);
        return newSort;
      });
    }
  }

  addGroup(column: string): void {
    if (!get(this.group).has(column)) {
      this.group.update((existing) => {
        const newGroup = new Set(existing);
        newGroup.add(column);
        return newGroup;
      });
    }
  }

  removeGroup(column: string): void {
    this.group.update((existing) => {
      const newGroup = new Set(existing);
      newGroup.delete(column);
      return newGroup;
    });
  }
}
