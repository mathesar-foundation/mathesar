import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import { TabularType } from '@mathesar/App.d';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/App.d';
import type {
  Result as ApiResult,
  Response as ApiRecordsResponse,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  ResultValue,
  GroupingMode,
} from '@mathesar/api/tables/records';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';

export interface Group {
  count: number;
  firstValue: ResultValue;
  lastValue: ResultValue;
  resultIndices: number[];
}

export interface Grouping {
  columns: string[];
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
    columns: apiGrouping.columns,
    mode: apiGrouping.mode,
    groups: apiGrouping.groups.map(buildGroup),
  };
}

interface TableRecordInResponse {
  [key: string]: unknown;
}

export interface TableRecord extends TableRecordInResponse {
  __identifier: string;
  __isAddPlaceholder?: boolean;
  __isNew?: boolean;
  __isGroupHeader?: boolean;
  __group?: Group;
  __rowIndex?: number;
  __state?: string; // TODO: Remove __state in favour of _recordsInProcess
  __groupValues?: Record<string, unknown>;
}

export interface TableRecordsData {
  state: States;
  error?: string;
  savedRecords: TableRecord[];
  totalCount: number;
  grouping?: Grouping;
}

export function getRowKey(
  row: TableRecord,
  primaryKeyColumn?: Column['name'],
): unknown {
  let key: unknown = row?.[primaryKeyColumn];
  if (!key && row?.__isNew) {
    key = row?.__identifier;
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

function preprocessRecords(
  offset: number,
  records?: TableRecordInResponse[],
  grouping?: Grouping,
): TableRecord[] {
  const groupingColumnNames = grouping?.columns ?? [];
  const isResultGrouped = groupingColumnNames.length > 0;
  const combinedRecords: TableRecord[] = [];
  let index = 0;
  let groupIndex = 0;
  let existingRecordIndex = 0;

  const recordIndexToGroupMap = getRecordIndexToGroupMap(
    grouping?.groups ?? [],
  );

  records?.forEach((record) => {
    if (!record.__isGroupHeader && !record.__isAddPlaceholder) {
      if (isResultGrouped) {
        let isGroup = false;
        if (index === 0) {
          isGroup = true;
        } else {
          // eslint-disable-next-line no-restricted-syntax
          for (const column of groupingColumnNames) {
            if (records[index - 1][column] !== records[index][column]) {
              isGroup = true;
              break;
            }
          }
        }

        if (isGroup) {
          combinedRecords.push({
            __isGroupHeader: true,
            __group: recordIndexToGroupMap.get(index),
            __identifier: generateRowIdentifier(
              'groupHeader',
              offset,
              groupIndex,
            ),
            __groupValues: record,
            __state: 'done',
          });
          groupIndex += 1;
        }
      }

      combinedRecords.push({
        ...record,
        __identifier: generateRowIdentifier(
          'normal',
          offset,
          existingRecordIndex,
        ),
        __rowIndex: index,
        __state: 'done',
      });
      index += 1;
      existingRecordIndex += 1;
    }
  });
  return combinedRecords;
}

function prepareRowForRequest(row: TableRecord): TableRecordInResponse {
  const rowForRequest: TableRecordInResponse = {};
  Object.keys(row).forEach((key) => {
    if (key.indexOf('__') !== 0) {
      rowForRequest[key] = row[key];
    }
  });
  return rowForRequest;
}

export class RecordsData {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private url: string;

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  savedRecords: Writable<TableRecord[]>;

  newRecords: Writable<TableRecord[]>;

  grouping: Writable<Grouping | undefined>;

  totalCount: Writable<number | undefined>;

  error: Writable<string | undefined>;

  private promise: CancellablePromise<ApiRecordsResponse>;

  private createPromises: Map<unknown, CancellablePromise<unknown>>;

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
    this.savedRecords = writable([] as TableRecord[]);
    this.newRecords = writable([] as TableRecord[]);
    this.grouping = writable<Grouping | undefined>(undefined);
    this.totalCount = writable<number | undefined>(undefined);
    this.error = writable<string | undefined>(undefined);

    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.url = `/${this.type === TabularType.Table ? 'tables' : 'views'}/${
      this.parentId
    }/records/`;
    this.fetchCallback = fetchCallback;
    void this.fetch();

    // TODO: Create base class to abstract subscriptions and unsubscriptions
    this.requestParamsUnsubscriber = this.meta.recordRequestParams.subscribe(
      () => {
        void this.fetch();
      },
    );
    this.columnPatchUnsubscriber = this.columnsDataStore.on(
      'columnPatched',
      () => {
        void this.fetch();
      },
    );
  }

  async fetch(
    retainExistingRows = false,
  ): Promise<TableRecordsData | undefined> {
    this.promise?.cancel();
    const offset = getStoreValue(this.meta.offset);

    this.savedRecords.update((existingData) => {
      let data = [...existingData];
      data.length = getStoreValue(this.meta.pageSize);

      let index = -1;
      data = data.map((entry) => {
        index += 1;
        if (!retainExistingRows || !entry) {
          return {
            __state: 'loading',
            __identifier: generateRowIdentifier('dummy', offset, index),
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
      const params = getStoreValue(this.meta.recordRequestParams);
      this.promise = getAPI<ApiRecordsResponse>(`${this.url}?${params ?? ''}`);
      const response = await this.promise;
      const totalCount = response.count || 0;
      const grouping = response.grouping
        ? buildGrouping(response.grouping)
        : undefined;
      const records = preprocessRecords(offset, response.results, grouping);
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

        const offset = getStoreValue(this.meta.offset);
        const savedRecords = getStoreValue(this.savedRecords);
        const savedRecordsLength = savedRecords?.length || 0;

        this.newRecords.update((existing) => {
          let retained = existing.filter(
            (entry) =>
              !successSet.has(
                getRowKey(entry, this.columnsDataStore.get()?.primaryKey),
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
              __rowIndex: savedRecordsLength + index,
              __identifier: generateRowIdentifier('new', offset, index),
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

  // TODO: Handle states where cell update and row update happen in parallel
  async updateCell(row: TableRecord, column: Column): Promise<void> {
    const { primaryKey } = this.columnsDataStore.get();
    if (primaryKey && row[primaryKey]) {
      const rowKey = getRowKey(row, primaryKey);
      const cellKey = `${rowKey.toString()}::${column.name}`;
      this.meta.setCellUpdateState(rowKey, cellKey, 'update');
      this.updatePromises?.get(cellKey)?.cancel();
      const promise = patchAPI<unknown>(
        `${this.url}${row[primaryKey] as string}/`,
        { [column.name]: row[column.name] },
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
  }

  async updateRecord(row: TableRecord): Promise<void> {
    const { primaryKey } = this.columnsDataStore.get();
    if (primaryKey && row[primaryKey]) {
      const rowKey = getRowKey(row, primaryKey);
      this.meta.setRecordModificationState(rowKey, 'update');
      this.updatePromises?.get(rowKey)?.cancel();
      const promise = patchAPI<unknown>(
        `${this.url}${row[primaryKey] as string}/`,
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
  }

  getNewEmptyRecord(): TableRecord {
    const offset = getStoreValue(this.meta.offset);
    const savedRecords = getStoreValue(this.savedRecords);
    const savedRecordsLength = savedRecords?.length || 0;
    const existingNewRecords = getStoreValue(this.newRecords);
    const identifier = generateRowIdentifier(
      'new',
      offset,
      existingNewRecords.length,
    );
    const newRecord: TableRecord = {
      __identifier: identifier,
      __state: States.Done,
      __isNew: true,
      __rowIndex: existingNewRecords.length + savedRecordsLength,
    };
    return newRecord;
  }

  async createRecord(row: TableRecord): Promise<void> {
    const { primaryKey } = this.columnsDataStore.get();
    const rowKey = getRowKey(row, primaryKey);
    this.meta.setRecordModificationState(rowKey, 'create');
    this.createPromises?.get(rowKey)?.cancel();
    const promise = postAPI<ApiResult>(this.url, prepareRowForRequest(row));
    if (!this.createPromises) {
      this.createPromises = new Map();
    }
    this.createPromises.set(rowKey, promise);

    try {
      const result = await promise;
      const newRow = {
        ...row,
        ...result,
        __isAddPlaceholder: false,
      };
      const updatedRowKey = getRowKey(newRow, primaryKey);
      this.meta.clearRecordModificationState(rowKey);
      this.meta.setRecordModificationState(updatedRowKey, 'created');
      this.newRecords.update((existing) =>
        existing.map((entry) => {
          if (entry.__identifier === row.__identifier) {
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

  async createOrUpdateRecord(row: TableRecord, column?: Column): Promise<void> {
    const { primaryKey } = this.columnsDataStore.get();

    // Row may not have been updated yet in view when additional request is made.
    // So check current values to ensure another row has not been created.
    const existingNewRecordRow = getStoreValue(this.newRecords)?.find(
      (entry) => entry.__identifier === row.__identifier,
    );

    if (!existingNewRecordRow && row.__isAddPlaceholder) {
      this.newRecords.update((existing) => {
        existing.push({
          ...row,
          __isAddPlaceholder: false,
        });
        return existing;
      });
    }

    if (
      primaryKey &&
      !existingNewRecordRow?.[primaryKey] &&
      row.__isNew &&
      !row[primaryKey]
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
      return savedRecords[index].__identifier;
    }
    const savedLength = savedRecords?.length || 0;
    const newRecordsData = getStoreValue(this.newRecords);
    if (newRecordsData?.[index + savedLength]) {
      return newRecordsData[index + savedLength].__identifier;
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
