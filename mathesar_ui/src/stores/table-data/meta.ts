import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { TabularType, DBObjectEntry } from '@mathesar/App.d';
import type { SelectOption } from '@mathesar-component-library/types';

export const DEFAULT_PAGE_SIZE = 500;
export const RECORD_COMBINED_STATE_KEY = '__combined';

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

export type MetaParams = [
  number[], // [pageSize, page]
  string[], // [sortcolumn, sortorder:'a'|'d', sc, so ...]
  string[], // [groupcolumn, gc, gc]
  string[], // [filtercombination:'a'|'o', filtercolumn, condition, value ...]
];

export type UpdateModificationType = 'update' | 'updated' | 'updateFailed';

export type ModificationType = 'create' | 'created' | 'creationFailed'
| UpdateModificationType
| 'delete' | 'deleteFailed';

export type ModificationStatus = 'inprocess' | 'complete' | 'error' | 'idle';
export type ModificationStateMap = Map<unknown, Map<unknown, ModificationType>>;

const inProgressSet: Set<ModificationType> = new Set(['create', 'update', 'delete']);
const completeSet: Set<ModificationType> = new Set(['created', 'updated']);
const errorSet: Set<ModificationType> = new Set(['creationFailed', 'updateFailed', 'deleteFailed']);

export function getGenericModificationStatusByPK(
  recordModificationState: ModificationStateMap,
  primaryKeyValue: unknown,
): ModificationStatus {
  const type = recordModificationState.get(primaryKeyValue)?.get(RECORD_COMBINED_STATE_KEY);
  if (inProgressSet.has(type)) {
    return 'inprocess';
  }
  if (completeSet.has(type)) {
    return 'complete';
  }
  if (errorSet.has(type)) {
    return 'error';
  }
  return 'idle';
}

function getCombinedUpdateState(cellMap: Map<unknown, ModificationType>): UpdateModificationType {
  let state: UpdateModificationType = 'updated';
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of cellMap) {
    if (key !== RECORD_COMBINED_STATE_KEY) {
      if (value === 'update') {
        state = 'update';
        break;
      } else if (value === 'updateFailed') {
        state = 'updateFailed';
        break;
      }
    }
  }
  return state;
}

// The Meta store is meant to be used by other stores for storing and operating on meta information.
// This may also include display properties. Properties in Meta store do not depend on other stores.
// For display specific properties that depend on other stores, the Display store can be used.
export class Meta {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  pageSize: Writable<number>;

  page: Writable<number>;

  offset: Readable<number>;

  sort: Writable<SortOption>;

  group: Writable<GroupOption>;

  filter: Writable<FilterOption>;

  selectedRecords: Writable<Set<unknown>>;

  // Row -> Cell -> Type
  recordModificationState: Writable<ModificationStateMap>;

  combinedModificationState: Readable<ModificationStatus>;

  recordRequestParams: Readable<string>;

  metaParameters: Readable<MetaParams>;

  constructor(
    type: TabularType,
    parentId: number,
    params?: MetaParams,
  ) {
    this.type = type;
    this.parentId = parentId;

    this.pageSize = writable(DEFAULT_PAGE_SIZE);
    this.page = writable(1);
    this.sort = writable(new Map() as SortOption);
    this.group = writable(new Set() as GroupOption);
    this.filter = writable({
      combination: filterCombinations[0],
      filters: [],
    });
    if (params) {
      this.loadFromParams(params);
    }

    this.selectedRecords = writable(new Set());
    this.recordModificationState = writable(new Map() as ModificationStateMap);

    this.offset = derived([this.pageSize, this.page], ([$pageSize, $page], set) => {
      set($pageSize * ($page - 1));
    });
    this.combinedModificationState = derived(
      this.recordModificationState,
      ($recordModificationState, set) => {
        if ($recordModificationState.size === 0) {
          set('idle');
        } else {
          let finalState: ModificationStatus = 'idle';
          // eslint-disable-next-line no-restricted-syntax
          for (const value of $recordModificationState.values()) {
            const rowState = value?.get(RECORD_COMBINED_STATE_KEY);
            if (inProgressSet.has(rowState)) {
              finalState = 'inprocess';
              break;
            }
            if (errorSet.has(rowState)) {
              finalState = 'error';
            } else if (completeSet.has(rowState) && finalState === 'idle') {
              finalState = 'complete';
            }
          }
          set(finalState);
        }
      },
      'idle' as ModificationStatus,
    );
    this.setRecordRequestParamsStore();
    this.setMetaParametersStore();
  }

  private setRecordRequestParamsStore(): void {
    this.recordRequestParams = derived(
      [
        this.pageSize,
        this.offset,
        this.group,
        this.sort,
        this.filter,
      ],
      ([$pageSize, $offset, $group, $sort, $filter]) => {
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
          if ('and' in filter && filter.and.length === 1 && filter.and[0].op === 'get_duplicates') {
            // Special handling for the get_duplicates operation due to backend bug
            // The backend can only handle the get_duplicates operation by itself
            // The "and" must be removed and the value must be in an array
            filter.and[0].value = [filter.and[0].field];
            params.push(
              `filters=${encodeURIComponent(JSON.stringify([filter.and[0]]))}`,
            );
          } else {
            // Handle other filters normally
            params.push(
              `filters=${encodeURIComponent(JSON.stringify(filter))}`,
            );
          }
        }
        return params.join('&');
      },
    );
  }

  private setMetaParametersStore(): void {
    this.metaParameters = derived(
      [
        this.pageSize,
        this.page,
        this.sort,
        this.group,
        this.filter,
      ],
      ([$pageSize, $page, $sort, $group, $filter]) => {
        const paginationOption: number[] = [
          $pageSize,
          $page,
        ];

        const sortOption: string[] = [];
        $sort.forEach((value, key) => {
          sortOption.push(key);
          const sortOrder = value === 'desc' ? 'd' : 'a';
          sortOption.push(sortOrder);
        });

        const groupOption: string[] = [...($group ?? [])];

        const filterOptions: string[] = [];
        const filterConfig = $filter;
        if (filterConfig?.filters?.length > 0) {
          filterOptions.push(filterConfig.combination.id === 'or' ? 'o' : 'a');
          filterConfig.filters.forEach((filter) => {
            filterOptions.push(filter.column.id as string);
            filterOptions.push(filter.condition.id as string);
            filterOptions.push(filter.value);
          });
        }

        const metaParams: MetaParams = [
          paginationOption,
          sortOption,
          groupOption,
          filterOptions,
        ];
        return metaParams;
      },
    );
  }

  loadFromParams(params: MetaParams): void {
    try {
      const [paginationOption, sortOption, groupOption, filterOption] = params;
      if (paginationOption?.length === 2) {
        this.pageSize.set(paginationOption[0] || DEFAULT_PAGE_SIZE);
        this.page.set(paginationOption[1] || 1);
      }

      if (sortOption?.length > 0) {
        const sortOptionMap: SortOption = new Map();
        for (let i = 0; i < sortOption.length; i += 2) {
          const sortOrder = sortOption[i + 1] === 'd' ? 'desc' : 'asc';
          sortOptionMap.set(sortOption[i], sortOrder);
        }
        if (sortOption.length > 0) {
          this.sort.set(sortOptionMap);
        }
      }

      const groupOptionSet: GroupOption = new Set(groupOption);
      if (groupOptionSet.size > 0) {
        this.group.set(groupOptionSet);
      }

      if (filterOption?.length > 0) {
        const filters: FilterEntry[] = [];
        const combination: FilterCombination['id'] = filterOption[0] === 'o' ? 'or' : 'and';
        for (let i = 1; i < filterOption.length;) {
          const column = filterOption[i];
          const condition = filterOption[i + 1];

          if (column && condition) {
            const value = filterOption[i + 2] || '';
            filters.push({
              column: {
                id: column,
                label: column,
              },
              condition: {
                id: condition,
                label: condition,
              },
              value,
            });
          }
          i += 3;
        }
        if (filters.length > 0) {
          this.filter.set({
            combination: {
              id: combination,
              label: combination,
            },
            filters,
          });
        }
      }
    } catch (err) {
      console.error('Unable to load meta information from params', err);
    }
  }

  clearSelectedRecords(): void {
    this.selectedRecords.set(new Set());
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

  selectRecordByPrimaryKey(primaryKeyValue: unknown): void {
    if (!get(this.selectedRecords).has(primaryKeyValue)) {
      this.selectedRecords.update((existingSet) => {
        const newSet = new Set(existingSet);
        newSet.add(primaryKeyValue);
        return newSet;
      });
    }
  }

  deSelectRecordByPrimaryKey(primaryKeyValue: unknown): void {
    if (get(this.selectedRecords).has(primaryKeyValue)) {
      this.selectedRecords.update((existingSet) => {
        const newSet = new Set(existingSet);
        newSet.delete(primaryKeyValue);
        return newSet;
      });
    }
  }

  setRecordModificationState(key: unknown, state: ModificationType): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      let cellMap = newMap.get(key);
      if (!cellMap) {
        cellMap = new Map();
        newMap.set(key, cellMap);
      }
      cellMap.set(RECORD_COMBINED_STATE_KEY, state);
      return newMap;
    });
  }

  clearRecordModificationState(key: unknown): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      newMap.delete(key);
      return newMap;
    });
  }

  clearAllRecordModificationStates(): void {
    this.recordModificationState.set(new Map());
  }

  setCellUpdateState(
    recordKey: unknown,
    cellKey: unknown,
    state: UpdateModificationType,
  ): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      let cellMap = newMap.get(recordKey);
      if (!cellMap) {
        cellMap = new Map();
        newMap.set(recordKey, cellMap);
      }
      cellMap.set(cellKey, state);
      cellMap.set(RECORD_COMBINED_STATE_KEY, getCombinedUpdateState(cellMap));
      return newMap;
    });
  }

  setMultipleRecordModificationStates(
    keys: unknown[],
    state: ModificationType,
  ): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      keys.forEach((rowKey) => {
        let cellMap = newMap.get(rowKey);
        if (!cellMap) {
          cellMap = new Map();
          newMap.set(rowKey, cellMap);
        }
        cellMap.set(RECORD_COMBINED_STATE_KEY, state);
      });
      return newMap;
    });
  }

  clearMultipleRecordModificationStates(
    keys: unknown[],
  ): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      keys.forEach((value) => {
        newMap.delete(value);
      });
      return newMap;
    });
  }
}
