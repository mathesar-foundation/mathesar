import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  // deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import type { Writable, Unsubscriber } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type {
  Result as ApiRecord,
  Response as ApiRecordsResponse,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  ResultValue,
  GroupingMode,
  FkSummary,
  GetRequestParams as ApiGetRequestParams,
  FkSummaryRecord,
} from '@mathesar/api/tables/records';
import type { Column } from '@mathesar/api/tables/columns';
import { getErrorMessage } from '@mathesar/utils/errors';
import type Pagination from '@mathesar/utils/Pagination';
import type { Meta } from './meta';
// import type { RowKey } from './utils';
import { validateRow, getCellKey } from './utils';
import type { ColumnsDataStore } from './columns';
import type { Sorting } from './sorting';
import type { Grouping as GroupingTODORename } from './grouping';
import type { Filtering } from './filtering';
import type { SearchFuzzy } from './searchFuzzy';

export interface RecordsRequestParamsData {
  pagination: Pagination;
  sorting: Sorting;
  grouping: GroupingTODORename;
  filtering: Filtering;
  searchFuzzy: SearchFuzzy;
}

function buildFetchQueryString(data: RecordsRequestParamsData): string {
  const params: ApiGetRequestParams = {
    ...data.pagination.recordsRequestParams(),
    ...data.sorting.recordsRequestParamsIncludingGrouping(data.grouping),
    ...data.grouping.recordsRequestParams(),
    ...data.filtering.recordsRequestParams(),
    ...data.searchFuzzy.recordsRequestParams(),
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
export type FkColumnSummary = Record<string, FkSummary>;

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

export type FkColumnsSummaryRecord = Record<string, FkSummaryRecord>;

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
  fkColumnsSummaryRecord?: FkColumnsSummaryRecord;
  groupValues?: Record<string, unknown>;
}

export type RecordRow = Omit<Row, 'record'> & Required<Pick<Row, 'record'>>;

export function rowHasRecord(row: Row): row is RecordRow {
  // Why do we also need to check that the record object is not empty?
  //
  // Because somewhere else in the code (I don't know where) we are producing
  // row objects which contain empty records. That behavior was causing a bug.
  // This function is a way to work around that bug without taking the time to
  // track down the root cause and fix/test it. At some point we should refactor
  // `Row` to be a union of different row types, none of which contain optional
  // properties. With that approach we can simplify this function to be more
  // straightforward.
  return row.record !== undefined && Object.entries(row.record).length > 0;
}

export interface TableRecordsData {
  state: States;
  error?: string;
  savedRecords: Row[];
  totalCount: number;
  grouping?: Grouping;
}

export function getRowKey(row: Row, primaryKeyColumnId?: Column['id']): string {
  if (row.record && primaryKeyColumnId !== undefined) {
    const primaryKeyCellValue = row.record[primaryKeyColumnId];
    if (primaryKeyCellValue) {
      return String(primaryKeyCellValue);
    }
  }
  if (row.isNew) {
    return row.identifier;
  }
  return '';
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
  fkColumnSummary,
}: {
  records: ApiRecord[];
  offset: number;
  grouping?: Grouping;
  fkColumnSummary?: FkColumnSummary;
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
        });
        groupIndex += 1;
      }
    }
    const fkColumnsSummaryRecord: FkColumnsSummaryRecord | undefined =
      fkColumnSummary
        ? Object.entries(fkColumnSummary).reduce(
            (fkColumnSummaryRecord, [columnId, summaryObj]) => ({
              ...fkColumnSummaryRecord,
              [columnId]: { ...summaryObj, data: summaryObj.data[index] },
            }),
            {},
          )
        : undefined;

    combinedRecords.push({
      record,
      fkColumnsSummaryRecord,
      identifier: generateRowIdentifier('normal', offset, existingRecordIndex),
      rowIndex: index,
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

  constructor(
    parentId: number,
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    fetchCallback?: (storeData: TableRecordsData) => void,
  ) {
    this.parentId = parentId;

    this.state = writable(States.Loading);
    this.savedRecords = writable([]);
    this.newRecords = writable([]);
    this.grouping = writable(undefined);
    this.totalCount = writable(undefined);
    this.error = writable(undefined);

    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.url = `/api/db/v0/tables/${this.parentId}/records/`;
    this.fetchCallback = fetchCallback;
    void this.fetch();

    // TODO: Create base class to abstract subscriptions and unsubscriptions
    this.requestParamsUnsubscriber =
      this.meta.recordsRequestParamsData.subscribe(() => {
        void this.fetch();
      });
  }

  async fetch(
    retainExistingRows = false,
  ): Promise<TableRecordsData | undefined> {
    this.promise?.cancel();
    const { offset } = getStoreValue(this.meta.pagination);

    this.savedRecords.update((existingData) => {
      let data = [...existingData];
      data.length = Math.min(
        data.length,
        getStoreValue(this.meta.pagination).size,
      );

      let index = -1;
      data = data.map((entry) => {
        index += 1;
        if (!retainExistingRows || !entry) {
          return {
            state: 'loading',
            identifier: generateRowIdentifier('dummy', offset, index),
            rowIndex: index,
            record: {},
          };
        }
        return entry;
      });

      return data;
    });
    this.error.set(undefined);
    if (!retainExistingRows) {
      this.state.set(States.Loading);
      this.newRecords.set([]);
      this.meta.cellClientSideErrors.clear();
      this.meta.cellModificationStatus.clear();
      this.meta.rowCreationStatus.clear();
      this.meta.rowDeletionStatus.clear();
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
      // Converting an array to a map type as it would be easier to reference
      const fkColumnSummary: FkColumnSummary | undefined =
        response.preview_data?.reduce(
          (acc, item) => ({
            ...acc,
            [item.column]: item,
          }),
          {},
        );
      const records = preprocessRecords({
        records: response.results,
        offset,
        grouping,
        fkColumnSummary,
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
    // TODO: Implement me!
    console.log(this);
    return Promise.resolve();
    // const rowKeys = [...this.meta.selectedRows.getValues()];

    // if (rowKeys.length > 0) {
    //   this.meta.rowDeletionStatus.setMultiple(rowKeys, { state: 'processing' });

    //   const successRowKeys = new Set<RowKey>();
    //   /** Values are error messages */
    //   const failures = new Map<RowKey, string>();
    //   // TODO: Convert this to single request
    //   const promises = rowKeys.map((pk) =>
    //     deleteAPI<RowKey>(`${this.url}${pk}/`)
    //       .then(() => {
    //         successRowKeys.add(pk);
    //         return successRowKeys;
    //       })
    //       .catch((error: unknown) => {
    //         failures.set(pk, getErrorMessage(error));
    //         return failures;
    //       }),
    //   );
    //   await Promise.all(promises);
    //   await this.fetch(true);

    //   const { offset } = getStoreValue(this.meta.pagination);
    //   const savedRecords = getStoreValue(this.savedRecords);
    //   const savedRecordsLength = savedRecords?.length || 0;
    //   const pkColumnId = this.columnsDataStore.get()?.primaryKeyColumnId;
    //   const savedRecordKeys = new Set(
    //     savedRecords.map((row) => getRowKey(row, pkColumnId)),
    //   );

    //   this.newRecords.update((existing) => {
    //     let retained = existing.filter(
    //       (row) => !successRowKeys.has(getRowKey(row, pkColumnId)),
    //     );
    //     retained = retained.filter(
    //       (row) => !savedRecordKeys.has(getRowKey(row, pkColumnId)),
    //     );

    //     if (retained.length === existing.length) {
    //       return existing;
    //     }
    //     let index = -1;
    //     retained = retained.map((row) => {
    //       index += 1;
    //       return {
    //         ...row,
    //         rowIndex: savedRecordsLength + index,
    //         identifier: generateRowIdentifier('new', offset, index),
    //       };
    //     });
    //     return retained;
    //   });
    //   this.meta.rowCreationStatus.delete([...savedRecordKeys]);
    //   this.meta.rowCreationStatus.delete([...successRowKeys]);
    //   this.meta.rowDeletionStatus.delete([...successRowKeys]);
    //   this.meta.selectedRows.delete([...successRowKeys]);
    //   this.meta.rowDeletionStatus.setEntries(
    //     [...failures.entries()].map(([rowKey, errorMsg]) => [
    //       rowKey,
    //       { state: 'failure', errors: [errorMsg] },
    //     ]),
    //   );
    // }
  }

  // TODO: It would be better to throw errors instead of silently failing
  // and returning a value.
  async updateCell(row: Row, column: Column): Promise<Row> {
    // TODO compute and validate client side errors before saving
    const { record } = row;
    if (!record) {
      console.error('Unable to update row that does not have a record');
      return row;
    }
    const { primaryKeyColumnId } = this.columnsDataStore.get();
    if (!primaryKeyColumnId) {
      // eslint-disable-next-line no-console
      console.error('Unable to update record for a row without a primary key');
      return row;
    }
    const primaryKeyValue = record[primaryKeyColumnId];
    if (primaryKeyValue === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'Unable to update record for a row with a missing primary key value',
      );
      return row;
    }
    const rowKey = getRowKey(row, primaryKeyColumnId);
    const cellKey = getCellKey(rowKey, column.id);
    this.meta.cellModificationStatus.set(cellKey, { state: 'processing' });
    this.updatePromises?.get(cellKey)?.cancel();
    const promise = patchAPI<ApiRecord>(
      `${this.url}${String(primaryKeyValue)}/`,
      { [column.id]: record[column.id] },
    );
    if (!this.updatePromises) {
      this.updatePromises = new Map();
    }
    this.updatePromises.set(cellKey, promise);

    try {
      const result = await promise;
      this.meta.cellModificationStatus.set(cellKey, { state: 'success' });
      return {
        ...row,
        record: result,
      };
    } catch (err) {
      this.meta.cellModificationStatus.set(cellKey, {
        state: 'failure',
        errors: [`Unable to save cell. ${getErrorMessage(err)}`],
      });
    } finally {
      if (this.updatePromises.get(cellKey) === promise) {
        this.updatePromises.delete(cellKey);
      }
    }
    return row;
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
    const record = Object.fromEntries(
      getStoreValue(this.columnsDataStore)
        .columns.filter((column) => column.default === null)
        .map((column) => [String(column.id), null]),
    );
    const newRow: Row = {
      record,
      identifier,
      isNew: true,
      rowIndex: existingNewRecords.length + savedRecordsLength,
    };
    return newRow;
  }

  async createRecord(row: Row): Promise<Row> {
    const { primaryKeyColumnId, columns } = this.columnsDataStore.get();
    const rowKey = getRowKey(row, primaryKeyColumnId);
    validateRow({
      row,
      rowKey,
      columns,
      cellClientSideErrors: this.meta.cellClientSideErrors,
    });
    if (getStoreValue(this.meta.rowsWithClientSideErrors).has(rowKey)) {
      return row;
    }

    const rowKeyOfBlankRow = getRowKey(row, primaryKeyColumnId);
    this.meta.rowCreationStatus.set(rowKeyOfBlankRow, { state: 'processing' });
    this.createPromises?.get(rowKeyOfBlankRow)?.cancel();
    const promise = postAPI<ApiRecord>(this.url, prepareRowForRequest(row));
    if (!this.createPromises) {
      this.createPromises = new Map();
    }
    this.createPromises.set(rowKeyOfBlankRow, promise);

    try {
      const record = await promise;
      const newRow: Row = {
        ...row,
        record,
        isAddPlaceholder: false,
      };
      const rowKeyWithRecord = getRowKey(newRow, primaryKeyColumnId);
      this.meta.rowCreationStatus.delete(rowKeyOfBlankRow);
      this.meta.rowCreationStatus.set(rowKeyWithRecord, { state: 'success' });
      this.newRecords.update((existing) =>
        existing.map((entry) => {
          if (entry.identifier === row.identifier) {
            return newRow;
          }
          return entry;
        }),
      );
      this.totalCount.update((count) => (count ?? 0) + 1);
      return newRow;
    } catch (err) {
      this.meta.rowCreationStatus.set(rowKeyOfBlankRow, {
        state: 'failure',
        errors: [getErrorMessage(err)],
      });
    } finally {
      if (this.createPromises.get(rowKeyOfBlankRow) === promise) {
        this.createPromises.delete(rowKeyOfBlankRow);
      }
    }
    return row;
  }

  async createOrUpdateRecord(row: Row, column: Column): Promise<Row> {
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

    let result = row;
    if (
      primaryKeyColumnId &&
      !existingNewRecordRow?.record?.[primaryKeyColumnId] &&
      row.isNew &&
      !row.record?.[primaryKeyColumnId]
    ) {
      result = await this.createRecord(row);
    } else {
      result = await this.updateCell(row, column);
    }
    return result;
  }

  async addEmptyRecord(): Promise<void> {
    const row = this.getNewEmptyRecord();
    this.newRecords.update((existing) => existing.concat(row));
    await this.createRecord(row);
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
  }
}
