import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import { TabularType } from '@mathesar/App.d';
import type {
  Writable,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry } from '@mathesar/App.d';
import type { Meta } from './meta';
import type { ColumnsDataStore, Column } from './columns';

interface TableRecordInResponse {
  [key: string]: unknown,
}
export interface TableRecord extends TableRecordInResponse {
  __identifier: string,
  __isAddPlaceholder?: boolean,
  __isNew?: boolean,
  __isGroupHeader?: boolean,
  __rowIndex?: number,
  __state?: string, // TODO: Remove __state in favour of _recordsInProcess
  __groupValues?: Record<string, unknown>,
}

export interface GroupCount {
  [key: string]: GroupCount | number
}

interface GroupInfo {
  counts: GroupCount,
  columns: Column['name'][]
}

export interface TableRecordsData {
  state: States,
  error?: string,
  savedRecords: TableRecord[],
  totalCount: number,
  groupCounts?: GroupCount,
  groupColumns?: string[],
}

interface TableRecordResponse extends PaginatedResponse<TableRecordInResponse> {
  group_count?: {
    group_count_by?: Column['name'][],
    results?: {
      count: number,
      values: string[]
    }[]
  }
}

export function getRowKey(
  row: TableRecord,
  primaryKeyColumn?: Column['name'],
): unknown {
  let key = row?.[primaryKeyColumn];
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

function mapGroupCounts(groupInfo: TableRecordResponse['group_count']): GroupCount {
  const groupResults = groupInfo.results;
  const groupMap: GroupCount = {};
  groupResults?.forEach((result) => {
    let group = groupMap;
    for (let i = 0; i < result.values.length - 1; i += 1) {
      const value = result.values[i];
      if (!group[value]) {
        group[value] = {};
      }
      group = group[value] as GroupCount;
    }
    group[result.values[result.values.length - 1]] = result.count;
  });
  return groupMap;
}

function preprocessRecords(
  offset: number,
  records?: TableRecordInResponse[],
  groupColumns?: string[],
): TableRecord[] {
  const isResultGrouped = groupColumns?.length > 0;
  const combinedRecords: TableRecord[] = [];
  let index = 0;
  let groupIndex = 0;
  let existingRecordIndex = 0;

  records?.forEach((record) => {
    if (!record.__isGroupHeader && !record.__isAddPlaceholder) {
      if (isResultGrouped) {
        let isGroup = false;
        if (index === 0) {
          isGroup = true;
        } else {
          // eslint-disable-next-line no-restricted-syntax
          for (const column of groupColumns) {
            if (records[index - 1][column] !== records[index][column]) {
              isGroup = true;
              break;
            }
          }
        }

        if (isGroup) {
          combinedRecords.push({
            __isGroupHeader: true,
            __identifier: generateRowIdentifier('groupHeader', offset, groupIndex),
            __groupValues: record,
            __state: 'done',
          });
          groupIndex += 1;
        }
      }

      combinedRecords.push({
        ...record,
        __identifier: generateRowIdentifier('normal', offset, existingRecordIndex),
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

  groupInfo: Writable<GroupInfo>;

  totalCount: Writable<number>;

  error: Writable<string>;

  private promise: CancellablePromise<TableRecordResponse>;

  private createPromises: Map<unknown, CancellablePromise<TableRecordResponse>>;

  private updatePromises: Map<unknown, CancellablePromise<TableRecordResponse>>;

  private fetchCallback?: (storeData: TableRecordsData) => void;

  private requestParamsUnsubscriber: Unsubscriber;

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
    this.groupInfo = writable(null as GroupInfo);
    this.totalCount = writable(null as number);
    this.error = writable(null as string);

    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.url = `/${this.type === TabularType.Table ? 'tables' : 'views'}/${this.parentId}/records/`;
    this.fetchCallback = fetchCallback;
    void this.fetch();

    // subscribers
    this.requestParamsUnsubscriber = this.meta.recordRequestParams.subscribe(() => {
      void this.fetch();
    });
  }

  async fetch(retainExistingRows = false): Promise<TableRecordsData> {
    this.promise?.cancel();
    const offset = getStoreValue(this.meta.offset);

    this.savedRecords.update((existingData) => {
      let data = [...existingData];
      data.length = getStoreValue(this.meta.pageSize);

      let index = -1;
      data = data.map((entry) => {
        index += 1;
        if (!retainExistingRows || !entry) {
          return { __state: 'loading', __identifier: generateRowIdentifier('dummy', offset, index) };
        }
        return entry;
      });

      return data;
    });
    this.error.set(null);
    this.state.set(States.Loading);
    if (!retainExistingRows) {
      this.newRecords.set([]);
      this.meta.clearAllRecordModificationStates();
    }

    try {
      const params = getStoreValue(this.meta.recordRequestParams);
      this.promise = getAPI<TableRecordResponse>(`${this.url}?${params ?? ''}`);

      const response = await this.promise;
      const totalCount = response.count || 0;

      const groupColumns = response?.group_count?.group_count_by;
      const isResultGrouped = groupColumns?.length > 0;
      let groupCounts: GroupCount = null;
      if (isResultGrouped) {
        groupCounts = mapGroupCounts(response.group_count);
      }

      const records = preprocessRecords(
        offset,
        response.results,
        groupColumns,
      );

      const storeData: TableRecordsData = {
        state: States.Done,
        savedRecords: records,
        groupCounts,
        groupColumns,
        totalCount,
      };
      this.savedRecords.set(records);
      this.state.set(States.Done);
      this.groupInfo.set({
        counts: groupCounts,
        columns: groupColumns,
      });
      this.totalCount.set(totalCount);
      this.error.set(null);

      this.fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.state.set(States.Error);
      this.error.set(err instanceof Error ? err.message : 'Unable to load records');
    }
    return null;
  }

  async deleteSelected(): Promise<void> {
    const pkSet = getStoreValue(this.meta.selectedRecords);

    if (pkSet.size > 0) {
      this.meta.setMultipleRecordModificationStates([...pkSet], 'delete');

      try {
        const successSet: Set<unknown> = new Set();
        const failed: unknown[] = [];
        // TODO: Convert this to single request
        const promises = [...pkSet].map((pk) => deleteAPI<unknown>(`${this.url}${pk as string}/`)
          .then(() => {
            successSet.add(pk);
            return successSet;
          })
          .catch(() => {
            failed.push(pk);
            return failed;
          }));
        await Promise.all(promises);
        await this.fetch(true);

        const offset = getStoreValue(this.meta.offset);
        const savedRecords = getStoreValue(this.savedRecords);
        const savedRecordsLength = savedRecords?.length || 0;

        this.newRecords.update((existing) => {
          let retained = existing.filter(
            (entry) => !successSet.has(getRowKey(entry, this.columnsDataStore.get()?.primaryKey)),
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
              __identifier: generateRowIdentifier(
                'new',
                offset,
                index,
              ),
            };
          });
          return retained;
        });
        this.meta.clearMultipleRecordModificationStates([...successSet]);
        this.meta.setMultipleRecordModificationStates(failed, 'deleteFailed');
      } catch (err) {
        this.meta.setMultipleRecordModificationStates([...pkSet], 'deleteFailed');
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
      const promise = patchAPI<TableRecordResponse>(
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
      const promise = patchAPI<TableRecordResponse>(
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
    const identifier = generateRowIdentifier('new', offset, existingNewRecords.length);
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
    const promise = postAPI<TableRecordResponse>(
      this.url,
      prepareRowForRequest(row),
    );
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
      this.newRecords.update((existing) => existing.map((entry) => {
        if (entry.__identifier === row.__identifier) {
          return newRow;
        }
        return entry;
      }));
      this.totalCount.update((count) => count + 1);
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
    const existingNewRecordRow = getStoreValue(this.newRecords)
      ?.find((entry) => entry.__identifier === row.__identifier);

    if (!existingNewRecordRow && row.__isAddPlaceholder) {
      this.newRecords.update((existing) => {
        existing.push({
          ...row,
          __isAddPlaceholder: false,
        });
        return existing;
      });
    }

    if (!existingNewRecordRow?.[primaryKey] && row.__isNew && !row[primaryKey]) {
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
    this.promise = null;

    this.requestParamsUnsubscriber();
  }
}
