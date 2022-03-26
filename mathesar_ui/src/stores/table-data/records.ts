import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/App.d';
import type {
  Result as ApiRecord,
  Response as ApiRecordsResponse,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  ResultValue,
  GroupingMode,
  GetRequestParams as ApiGetRequestParams,
} from '@mathesar/api/tables/records';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';
import type { Pagination } from './pagination';
import type { Sorting } from './sorting';
import type { Grouping as GroupingTODORename } from './grouping';
import type { Filtering } from './filtering';
import { TabularType } from './TabularType';

export interface RecordsRequestParamsData {
  pagination: Pagination;
  sorting: Sorting;
  grouping: GroupingTODORename;
  filtering: Filtering;
}

function buildFetchQueryString(data: RecordsRequestParamsData): string {
  const params: ApiGetRequestParams = {
    ...data.pagination.recordsRequestParams(),
    ...data.sorting.recordsRequestParamsIncludingGrouping(data.grouping),
    ...data.grouping.recordsRequestParams(),
    ...data.filtering.recordsRequestParams(),
  };
  const entries: [string, string][] = Object.entries(params).map(([k, v]) => {
    const value = typeof v === 'string' ? v : JSON.stringify(v);
    return [k, value];
  });
  return new URLSearchParams(entries).toString();
}

export interface Group {
  count: number;
  firstValue: ResultValue;
  lastValue: ResultValue;
  resultIndices: number[];
}

export interface Grouping {
  columnIds: number[];
  mode: GroupingMode;
  groups: Group[];
}

function buildGroup(apiGroup: ApiGroup): Group {
  return {
    count: apiGroup.count,
    firstValue: apiGroup.first_value,
    lastValue: apiGroup.last_value,
    resultIndices: apiGroup.result_indices,
  };
}

function buildGrouping(apiGrouping: ApiGrouping): Grouping {
  return {
    columnIds: apiGrouping.columns,
    mode: apiGrouping.mode,
    groups: apiGrouping.groups.map(buildGroup),
  };
}

export interface Row {
  /**
   * Can be `undefined` because some rows don't have an associated record, e.g.
   * group headers, dummy rows, etc.
   */
  record?: ApiRecord;
  identifier: string;
  isAddPlaceholder?: boolean;
  isNew?: boolean;
  isNewHelpText?: boolean;
  isGroupHeader?: boolean;
  group?: Group;
  rowIndex?: number;
  state?: string;
  groupValues?: Record<string, unknown>;
}

export interface TableRecordsData {
  state: States;
  error?: string;
  savedRecords: Row[];
  totalCount: number;
  grouping?: Grouping;
}

export function getRowKey(
  row: Row,
  primaryKeyColumnId?: Column['id'],
): unknown {
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  let key: unknown = row?.[primaryKeyColumnId];
  if (!key && row?.isNew) {
    key = row?.identifier;
  }
  return key;
}

function generateRowIdentifier(
  type: 'groupHeader' | 'normal' | 'dummy' | 'new',
  offset: number,
  index: number,
): string {
  return `__${offset}_${type}_${index}`;
}

function getRecordIndexToGroupMap(groups: Group[]): Map<number, Group> {
  const map = new Map<number, Group>();
  groups.forEach((group) => {
    group.resultIndices.forEach((resultIndex) => {
      map.set(resultIndex, group);
    });
  });
  return map;
}

function preprocessRecords({
  records,
  offset,
  grouping,
}: {
  records: ApiRecord[];
  offset: number;
  grouping?: Grouping;
}): Row[] {
  const groupingColumnIds = grouping?.columnIds ?? [];
  const isResultGrouped = groupingColumnIds.length > 0;
  const combinedRecords: Row[] = [];
  let index = 0;
  let groupIndex = 0;
  let existingRecordIndex = 0;

  const recordIndexToGroupMap = getRecordIndexToGroupMap(
    grouping?.groups ?? [],
  );

  records?.forEach((record) => {
    if (isResultGrouped) {
      let isGroup = false;
      if (index === 0) {
        isGroup = true;
      } else {
        // eslint-disable-next-line no-restricted-syntax
        for (const id of groupingColumnIds) {
          if (records[index - 1][id] !== records[index][id]) {
            isGroup = true;
            break;
          }
        }
      }

      if (isGroup) {
        combinedRecords.push({
          record,
          isGroupHeader: true,
          group: recordIndexToGroupMap.get(index),
          identifier: generateRowIdentifier('groupHeader', offset, groupIndex),
          groupValues: record,
          state: 'done',
        });
        groupIndex += 1;
      }
    }

    combinedRecords.push({
      record,
      identifier: generateRowIdentifier('normal', offset, existingRecordIndex),
      rowIndex: index,
      state: 'done',
    });
    index += 1;
    existingRecordIndex += 1;
  });
  return combinedRecords;
}

function prepareRowForRequest(row: Row): ApiRecord {
  return row.record ?? {};
}

export class RecordsData {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private url: string;

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  savedRecords: Writable<Row[]>;

  newRecords: Writable<Row[]>;

  grouping: Writable<Grouping | undefined>;

  totalCount: Writable<number | undefined>;

  error: Writable<string | undefined>;

  private promise: CancellablePromise<ApiRecordsResponse> | undefined;

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  private createPromises: Map<unknown, CancellablePromise<unknown>>;

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  private updatePromises: Map<unknown, CancellablePromise<unknown>>;

  private fetchCallback?: (storeData: TableRecordsData) => void;

  private requestParamsUnsubscriber: Unsubscriber;

  private columnPatchUnsubscriber: () => void;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    fetchCallback?: (storeData: TableRecordsData) => void,
  ) {
    this.type = type;
    this.parentId = parentId;

    this.state = writable(States.Loading);
    this.savedRecords = writable([]);
    this.newRecords = writable([]);
    this.grouping = writable(undefined);
    this.totalCount = writable(undefined);
    this.error = writable(undefined);

    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    const tabularEntity = this.type === TabularType.Table ? 'tables' : 'views';
    this.url = `/api/db/v0/${tabularEntity}/${this.parentId}/records/`;
    this.fetchCallback = fetchCallback;
    void this.fetch();

    // TODO: Create base class to abstract subscriptions and unsubscriptions
    this.requestParamsUnsubscriber =
      this.meta.recordsRequestParamsData.subscribe(() => {
        void this.fetch();
      });
    this.columnPatchUnsubscriber = this.columnsDataStore.on(
      'columnPatched',
      () => this.fetch(),
    );
  }

  async fetch(
    retainExistingRows = false,
  ): Promise<TableRecordsData | undefined> {
    this.promise?.cancel();
    const { offset } = getStoreValue(this.meta.pagination);

    this.savedRecords.update((existingData) => {
      let data = [...existingData];
      data.length = getStoreValue(this.meta.pagination).size;

      let index = -1;
      data = data.map((entry) => {
        index += 1;
        if (!retainExistingRows || !entry) {
          return {
            state: 'loading',
            identifier: generateRowIdentifier('dummy', offset, index),
          };
        }
        return entry;
      });

      return data;
    });
    this.error.set(undefined);
    this.state.set(States.Loading);
    if (!retainExistingRows) {
      this.newRecords.set([]);
      this.meta.clearAllRecordModificationStates();
    }

    try {
      const params = getStoreValue(this.meta.recordsRequestParamsData);
      const queryString = buildFetchQueryString(params);
      this.promise = getAPI<ApiRecordsResponse>(`${this.url}?${queryString}`);
      const response = await this.promise;
      const totalCount = response.count || 0;
      const grouping = response.grouping
        ? buildGrouping(response.grouping)
        : undefined;
      const records = preprocessRecords({
        records: response.results,
        offset,
        grouping,
      });
      const tableRecordsData: TableRecordsData = {
        state: States.Done,
        savedRecords: records,
        grouping,
        totalCount,
      };
      this.savedRecords.set(records);
      this.state.set(States.Done);
      this.grouping.set(grouping);
      this.totalCount.set(totalCount);
      this.error.set(undefined);
      this.fetchCallback?.(tableRecordsData);
      return tableRecordsData;
    } catch (err) {
      this.state.set(States.Error);
      this.error.set(
        err instanceof Error ? err.message : 'Unable to load records',
      );
    }
    return undefined;
  }

  async deleteSelected(): Promise<void> {
    const pkSet = getStoreValue(this.meta.selectedRecords);

    if (pkSet.size > 0) {
      this.meta.setMultipleRecordModificationStates([...pkSet], 'delete');

      try {
        const successSet: Set<unknown> = new Set();
        const failed: unknown[] = [];
        // TODO: Convert this to single request
        const promises = [...pkSet].map((pk) =>
          deleteAPI<unknown>(`${this.url}${pk as string}/`)
            .then(() => {
              successSet.add(pk);
              return successSet;
            })
            .catch(() => {
              failed.push(pk);
              return failed;
            }),
        );
        await Promise.all(promises);
        await this.fetch(true);

        const { offset } = getStoreValue(this.meta.pagination);
        const savedRecords = getStoreValue(this.savedRecords);
        const savedRecordsLength = savedRecords?.length || 0;

        this.newRecords.update((existing) => {
          let retained = existing.filter(
            (entry) =>
              !successSet.has(
                getRowKey(
                  entry,
                  this.columnsDataStore.get()?.primaryKeyColumnId,
                ),
              ),
          );
          if (retained.length === existing.length) {
            return existing;
          }
          let index = -1;
          retained = retained.map((entry) => {
            index += 1;
            return {
              ...entry,
              rowIndex: savedRecordsLength + index,
              identifier: generateRowIdentifier('new', offset, index),
            };
          });
          return retained;
        });
        this.meta.clearMultipleRecordModificationStates([...successSet]);
        this.meta.setMultipleRecordModificationStates(failed, 'deleteFailed');
      } catch (err) {
        this.meta.setMultipleRecordModificationStates(
          [...pkSet],
          'deleteFailed',
        );
      } finally {
        this.meta.clearSelectedRecords();
      }
    }
  }

  /**
   * TODO:
   * - Handle states where cell update and row update happen in parallel
   * - Reduce code duplication between `updateCell` and `updateRecord`
   */
  async updateCell(row: Row, column: Column): Promise<void> {
    const { record } = row;
    if (!record) {
      console.error('Unable to update row that does not have a record');
      return;
    }
    const { primaryKeyColumnId } = this.columnsDataStore.get();
    if (!primaryKeyColumnId) {
      // eslint-disable-next-line no-console
      console.error('Unable to update record for a row without a primary key');
      return;
    }
    const primaryKeyValue = record[primaryKeyColumnId];
    if (primaryKeyValue === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'Unable to update record for a row with a missing primary key value',
      );
      return;
    }
    const rowKey = getRowKey(row, primaryKeyColumnId);
    const rowKeyString = String(rowKey);
    const cellKey = `${rowKeyString}::${column.id}`;
    this.meta.setCellUpdateState(rowKey, cellKey, 'update');
    this.updatePromises?.get(cellKey)?.cancel();
    const promise = patchAPI<unknown>(
      `${this.url}${String(primaryKeyValue)}/`,
      { [column.id]: record[column.id] },
    );
    if (!this.updatePromises) {
      this.updatePromises = new Map();
    }
    this.updatePromises.set(cellKey, promise);

    try {
      await promise;
      this.meta.setCellUpdateState(rowKey, cellKey, 'updated');
    } catch (err) {
      this.meta.setCellUpdateState(rowKey, cellKey, 'updateFailed');
    } finally {
      if (this.updatePromises.get(cellKey) === promise) {
        this.updatePromises.delete(cellKey);
      }
    }
  }

  /**
   * TODO:
   * - Reduce code duplication between `updateCell` and `updateRecord`
   */
  async updateRecord(row: Row): Promise<void> {
    const { record } = row;
    if (!record) {
      console.error('Unable to update row that does not have a record');
      return;
    }
    const { primaryKeyColumnId } = this.columnsDataStore.get();
    if (!primaryKeyColumnId) {
      // eslint-disable-next-line no-console
      console.error('Unable to update record for a row without a primary key');
      return;
    }
    const primaryKeyValue = record[primaryKeyColumnId];
    if (primaryKeyValue === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'Unable to update record for a row with a missing primary key value',
      );
      return;
    }
    const rowKey = getRowKey(row, primaryKeyColumnId);
    this.meta.setRecordModificationState(rowKey, 'update');
    this.updatePromises?.get(rowKey)?.cancel();
    const promise = patchAPI<unknown>(
      `${this.url}${String(primaryKeyValue)}/`,
      prepareRowForRequest(row),
    );
    if (!this.updatePromises) {
      this.updatePromises = new Map();
    }
    this.updatePromises.set(rowKey, promise);

    try {
      await promise;
      this.meta.setRecordModificationState(rowKey, 'updated');
    } catch (err) {
      this.meta.setRecordModificationState(rowKey, 'updateFailed');
    } finally {
      if (this.updatePromises.get(rowKey) === promise) {
        this.updatePromises.delete(rowKey);
      }
    }
  }

  getNewEmptyRecord(): Row {
    const { offset } = getStoreValue(this.meta.pagination);
    const savedRecords = getStoreValue(this.savedRecords);
    const savedRecordsLength = savedRecords?.length || 0;
    const existingNewRecords = getStoreValue(this.newRecords);
    const identifier = generateRowIdentifier(
      'new',
      offset,
      existingNewRecords.length,
    );
    const newRecord: Row = {
      record: {},
      identifier,
      state: States.Done,
      isNew: true,
      rowIndex: existingNewRecords.length + savedRecordsLength,
    };
    return newRecord;
  }

  async createRecord(row: Row): Promise<void> {
    const { primaryKeyColumnId: primaryKey } = this.columnsDataStore.get();
    const rowKey = getRowKey(row, primaryKey);
    this.meta.setRecordModificationState(rowKey, 'create');
    this.createPromises?.get(rowKey)?.cancel();
    const promise = postAPI<ApiRecord>(this.url, prepareRowForRequest(row));
    if (!this.createPromises) {
      this.createPromises = new Map();
    }
    this.createPromises.set(rowKey, promise);

    try {
      const record = await promise;
      const newRow: Row = {
        ...row,
        record,
        isAddPlaceholder: false,
      };
      const updatedRowKey = getRowKey(newRow, primaryKey);
      this.meta.clearRecordModificationState(rowKey);
      this.meta.setRecordModificationState(updatedRowKey, 'created');
      this.newRecords.update((existing) =>
        existing.map((entry) => {
          if (entry.identifier === row.identifier) {
            return newRow;
          }
          return entry;
        }),
      );
      this.totalCount.update((count) => (count ?? 0) + 1);
    } catch (err) {
      this.meta.setRecordModificationState(rowKey, 'creationFailed');
    } finally {
      if (this.createPromises.get(rowKey) === promise) {
        this.createPromises.delete(rowKey);
      }
    }
  }

  async createOrUpdateRecord(row: Row, column?: Column): Promise<void> {
    const { primaryKeyColumnId } = this.columnsDataStore.get();

    // Row may not have been updated yet in view when additional request is made.
    // So check current values to ensure another row has not been created.
    const existingNewRecordRow = getStoreValue(this.newRecords).find(
      (entry) => entry.identifier === row.identifier,
    );

    if (!existingNewRecordRow && row.isAddPlaceholder) {
      this.newRecords.update((existing) => {
        existing.push({
          ...row,
          isAddPlaceholder: false,
        });
        return existing;
      });
    }

    if (
      primaryKeyColumnId &&
      !existingNewRecordRow?.record?.[primaryKeyColumnId] &&
      row.isNew &&
      !row.record?.[primaryKeyColumnId]
    ) {
      await this.createRecord(row);
    } else if (column) {
      await this.updateCell(row, column);
    } else {
      await this.updateRecord(row);
    }
  }

  async addEmptyRecord(): Promise<void> {
    const newRecord = this.getNewEmptyRecord();
    this.newRecords.update((existing) => existing.concat(newRecord));
    await this.createRecord(newRecord);
  }

  getIterationKey(index: number): string {
    const savedRecords = getStoreValue(this.savedRecords);
    if (savedRecords?.[index]) {
      return savedRecords[index].identifier;
    }
    const savedLength = savedRecords?.length || 0;
    const newRecordsData = getStoreValue(this.newRecords);
    if (newRecordsData?.[index + savedLength]) {
      return newRecordsData[index + savedLength].identifier;
    }
    return `__index_${index}`;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;

    this.requestParamsUnsubscriber();
    this.columnPatchUnsubscriber();
  }
}
