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
import type { Columns, TableColumn } from './columns';

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
  columns: TableColumn['name'][]
}

interface TableRecordData {
  state: States,
  error?: string,
  savedRecords: TableRecord[],
  totalCount: number,
  groupCounts?: GroupCount,
  groupColumns?: string[],
}

interface TableRecordResponse extends PaginatedResponse<TableRecordInResponse> {
  group_count?: {
    group_count_by?: TableColumn['name'][],
    results?: {
      count: number,
      values: string[]
    }[]
  }
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
            __identifier: `__${offset}_group_header_${groupIndex}`,
            __groupValues: record,
            __state: 'done',
          });
          groupIndex += 1;
        }
      }

      combinedRecords.push({
        ...record,
        __identifier: `__${offset}_index_${existingRecordIndex}`,
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

export class Records {
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  _url: string;

  _meta: Meta;

  _columns: Columns;

  state: Writable<States>;

  savedRecords: Writable<TableRecord[]>;

  newRecords: Writable<TableRecord[]>;

  groupInfo: Writable<GroupInfo>;

  totalCount: Writable<number>;

  error: Writable<string>;

  _promise: CancellablePromise<TableRecordResponse>;

  _createPromises: Map<unknown, CancellablePromise<TableRecordResponse>>;

  _updatePromises: Map<unknown, CancellablePromise<TableRecordResponse>>;

  _fetchCallback?: (storeData: TableRecordData) => void;

  _requestParamsUnsubscriber: Unsubscriber;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    columns: Columns,
    fetchCallback?: (storeData: TableRecordData) => void,
  ) {
    this._type = type;
    this._parentId = parentId;

    this.state = writable(States.Loading);
    this.savedRecords = writable([] as TableRecord[]);
    this.newRecords = writable([] as TableRecord[]);
    this.groupInfo = writable(null as GroupInfo);
    this.totalCount = writable(null as number);
    this.error = writable(null as string);

    this._meta = meta;
    this._columns = columns;
    this._url = `/${this._type === TabularType.Table ? 'tables' : 'views'}/${this._parentId}/records/`;
    this._fetchCallback = fetchCallback;
    void this.fetch();

    // subscribers
    this._requestParamsUnsubscriber = this._meta.recordRequestParams.subscribe(() => {
      void this.fetch();
    });
  }

  async fetch(retainExistingRows = false): Promise<TableRecordData> {
    this._promise?.cancel();

    this.savedRecords.update((existingData) => {
      let data = [...existingData];

      data.length = getStoreValue(this._meta.pageSize);
      let index = -1;
      data = data.map((entry) => {
        index += 1;
        if (!retainExistingRows || !entry) {
          return { __state: 'loading', __identifier: `__dummy_index_${index}` };
        }
        return entry;
      });

      return data;
    });
    this.error.set(null);
    this.state.set(States.Loading);
    if (!retainExistingRows) {
      this.newRecords.set([]);
    }

    this._meta.clearAllRecordModificationStates();

    try {
      const params = getStoreValue(this._meta.recordRequestParams);
      this._promise = getAPI<TableRecordResponse>(`${this._url}?${params ?? ''}`);

      const response = await this._promise;
      const totalCount = response.count || 0;

      const groupColumns = response?.group_count?.group_count_by;
      const isResultGrouped = groupColumns?.length > 0;
      let groupCounts: GroupCount = null;
      if (isResultGrouped) {
        groupCounts = mapGroupCounts(response.group_count);
      }

      const records = preprocessRecords(
        getStoreValue(this._meta.offset),
        response.results,
        groupColumns,
      );

      const storeData: TableRecordData = {
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

      this._fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.state.set(States.Error);
      this.error.set(err instanceof Error ? err.message : 'Unable to load records');
    }
    return null;
  }

  async deleteSelected(): Promise<void> {
    const pkSet = getStoreValue(this._meta.selectedRecords);

    if (pkSet.size > 0) {
      this._meta.setMultipleRecordModificationStates([...pkSet], 'delete');

      try {
        const failed: unknown[] = [];
        // TODO: Convert this to single request
        const promises = [...pkSet].map((pk) => deleteAPI<unknown>(`${this._url}${pk as string}/`)
          .catch(() => {
            failed.push(pk);
            return failed;
          }));
        await Promise.all(promises);
        await this.fetch(true);
        this._meta.setMultipleRecordModificationStates(failed, 'deleteFailed');
      } catch (err) {
        this._meta.setMultipleRecordModificationStates([...pkSet], 'deleteFailed');
      } finally {
        this._meta.clearSelectedRecords();
      }
    }
  }

  async updateRecord(row: TableRecord): Promise<void> {
    const { primaryKey } = this._columns.get();
    if (primaryKey && row[primaryKey]) {
      this._meta.setRecordModificationState(row[primaryKey], 'update');
      this._updatePromises?.get(row[primaryKey])?.cancel();
      const promise = patchAPI<TableRecordResponse>(
        `${this._url}${row[primaryKey] as string}/`,
        prepareRowForRequest(row),
      );
      if (!this._updatePromises) {
        this._updatePromises = new Map();
      }
      this._updatePromises.set(row[primaryKey], promise);

      try {
        await promise;
        this._meta.setRecordModificationState(row[primaryKey], 'updated');
      } catch (err) {
        this._meta.setRecordModificationState(row[primaryKey], 'updateFailed');
      } finally {
        if (this._updatePromises.get(row[primaryKey]) === promise) {
          this._updatePromises.delete(row[primaryKey]);
        }
      }
    }
  }

  async createOrUpdateRecord(row: TableRecord): Promise<void> {
    const { primaryKey } = this._columns.get();
    if (row.__isNew && (!primaryKey || !row[primaryKey])) {
      this._meta.setRecordModificationState(row.__identifier, 'create');
      this._createPromises?.get(row.__identifier)?.cancel();
      const promise = postAPI<TableRecordResponse>(
        this._url,
        prepareRowForRequest(row),
      );
      if (!this._createPromises) {
        this._createPromises = new Map();
      }
      this._createPromises.set(row.__identifier, promise);

      try {
        const result = await promise;
        this._meta.setRecordModificationState(row.__identifier, 'created');
        this.newRecords.update((existing) => existing.map((entry) => {
          if (entry.__identifier === row.__identifier) {
            return {
              ...row,
              ...result,
            };
          }
          return entry;
        }));
      } catch (err) {
        this._meta.setRecordModificationState(row.__identifier, 'creationFailed');
      } finally {
        if (this._createPromises.get(row.__identifier) === promise) {
          this._createPromises.delete(row.__identifier);
        }
      }
    } else {
      await this.updateRecord(row);
    }
  }

  async addEmptyRecord(): Promise<void> {
    const offset = getStoreValue(this._meta.offset);
    const existingNewRecords = getStoreValue(this.newRecords);
    const identifier = `__${offset}_new_${-existingNewRecords.length - 1}`;
    const newRecord: TableRecord = {
      __identifier: identifier,
      __state: States.Done,
      __isNew: true,
      __rowIndex: -existingNewRecords.length - 1,
    };
    this.newRecords.update((existing) => [
      newRecord,
    ].concat(existing));
    await this.createOrUpdateRecord(newRecord);
  }

  destroy(): void {
    this._promise?.cancel();
    this._promise = null;

    this._requestParamsUnsubscriber();
  }
}
