import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { TerseFiltering } from './filtering';
import { Filtering } from './filtering';
import type { TerseSorting } from './sorting';
import { Sorting } from './sorting';
import type { TersePagination } from './pagination';
import { Pagination } from './pagination';
import type { TerseGrouping } from './grouping';
import { Grouping } from './grouping';
import type { RecordsRequestParamsData } from './records';

export const RECORD_COMBINED_STATE_KEY = '__combined';

export type UpdateModificationType = 'update' | 'updated' | 'updateFailed';

export type ModificationType =
  | 'create'
  | 'created'
  | 'creationFailed'
  | UpdateModificationType
  | 'delete'
  | 'deleteFailed';

export type ModificationStatus = 'inprocess' | 'complete' | 'error' | 'idle';
export type ModificationStateMap = Map<unknown, Map<unknown, ModificationType>>;

const inProgressSet: Set<ModificationType> = new Set([
  'create',
  'update',
  'delete',
]);
const completeSet: Set<ModificationType> = new Set(['created', 'updated']);
const errorSet: Set<ModificationType> = new Set([
  'creationFailed',
  'updateFailed',
  'deleteFailed',
]);

export function getGenericModificationStatusByPK(
  recordModificationState: ModificationStateMap,
  primaryKeyValue: unknown,
): ModificationStatus {
  const type = recordModificationState
    .get(primaryKeyValue)
    ?.get(RECORD_COMBINED_STATE_KEY);
  if (!type) {
    return 'idle';
  }
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

function getCombinedUpdateState(
  cellMap: Map<unknown, ModificationType>,
): UpdateModificationType {
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

function getCombinedModificationState(
  recordModificationState: Readable<ModificationStateMap>,
) {
  return derived(
    recordModificationState,
    ($recordModificationState, set) => {
      if ($recordModificationState.size === 0) {
        set('idle');
      } else {
        let finalState: ModificationStatus = 'idle';
        // eslint-disable-next-line no-restricted-syntax
        for (const value of $recordModificationState.values()) {
          const rowState = value?.get(RECORD_COMBINED_STATE_KEY);
          if (rowState) {
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
        }
        set(finalState);
      }
    },
    'idle' as ModificationStatus,
  );
}

export interface MetaProps {
  pagination: Pagination;
  sorting: Sorting;
  grouping: Grouping;
  filtering: Filtering;
}

/** Adds default values. */
function getFullMetaProps(p?: Partial<MetaProps>): MetaProps {
  return {
    pagination: p?.pagination ?? new Pagination(),
    sorting: p?.sorting ?? new Sorting(),
    grouping: p?.grouping ?? new Grouping(),
    filtering: p?.filtering ?? new Filtering(),
  };
}

export type TerseMetaProps = [
  TersePagination,
  TerseSorting,
  TerseGrouping,
  TerseFiltering,
];

export function makeMetaProps(t: TerseMetaProps): MetaProps {
  return {
    pagination: Pagination.fromTerse(t[0]),
    sorting: Sorting.fromTerse(t[1]),
    grouping: Grouping.fromTerse(t[2]),
    filtering: Filtering.fromTerse(t[3]),
  };
}

export function makeTerseMetaProps(p?: Partial<MetaProps>): TerseMetaProps {
  const props = getFullMetaProps(p);
  return [
    props.pagination.terse(),
    props.sorting.terse(),
    props.grouping.terse(),
    props.filtering.terse(),
  ];
}

/**
 * The Meta store is meant to be used by other stores for storing and operating
 * on meta information. This may also include display properties. Properties in
 * Meta store do not depend on other stores. For display specific properties
 * that depend on other stores, the Display store can be used.
 */
export class Meta {
  pagination: Writable<Pagination>;

  sorting: Writable<Sorting>;

  grouping: Writable<Grouping>;

  filtering: Writable<Filtering>;

  selectedRecords: Writable<Set<unknown>>;

  // Row -> Cell -> Type
  recordModificationState: Writable<ModificationStateMap>;

  combinedModificationState: Readable<ModificationStatus>;

  /**
   * Allows us to save and re-create Meta, e.g. from data stored in the tab
   * system.
   */
  props: Readable<MetaProps>;

  /**
   * Allows us to re-fetch records from the server when some of the parameters
   * change.
   */
  recordsRequestParamsData: Readable<RecordsRequestParamsData>;

  constructor(p?: Partial<MetaProps>) {
    const props = getFullMetaProps(p);
    this.pagination = writable(props.pagination);
    this.sorting = writable(props.sorting);
    this.grouping = writable(props.grouping);
    this.filtering = writable(props.filtering);

    this.selectedRecords = writable(new Set());
    this.recordModificationState = writable(new Map() as ModificationStateMap);

    this.combinedModificationState = getCombinedModificationState(
      this.recordModificationState,
    );

    // Why do `this.props` and `this.recordsRequestParamsData` look identical?
    //
    // It's a coincidence that `MetaProps` and `RecordsRequestParamsData` are
    // almost identical, but that might not always be the case. For example, if
    // we want to store info in the tabs system about the selected cells, then
    // `MetaProps` would need more fields. Using separate fields for
    // `this.props` and `this.recordsRequestParamsData` gives us a separation
    // of concerns.
    this.props = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
    this.recordsRequestParamsData = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
  }

  clearSelectedRecords(): void {
    this.selectedRecords.set(new Set());
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

  clearMultipleRecordModificationStates(keys: unknown[]): void {
    this.recordModificationState.update((existingMap) => {
      const newMap = new Map(existingMap);
      keys.forEach((value) => {
        newMap.delete(value);
      });
      return newMap;
    });
  }
}
