import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import type { Writable, Unsubscriber } from 'svelte/store';
import {
  isDefinedNonNullable,
  type CancellablePromise,
} from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type {
  Result as ApiRecord,
  Response as ApiRecordsResponse,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  GroupingMode,
  GetRequestParams as ApiGetRequestParams,
} from '@mathesar/api/tables/records';
import type { Column } from '@mathesar/api/tables/columns';
import { getErrorMessage } from '@mathesar/utils/errors';
import type Pagination from '@mathesar/utils/Pagination';
import { buildRecordSummariesForSheet } from './record-summaries/recordSummaryUtils';
import type { Meta } from './meta';
import type { RowKey } from './utils';
import { validateRow, getCellKey } from './utils';
import type { ColumnsDataStore } from './columns';
import type { Sorting } from './sorting';
import type { Grouping as GroupingRequest } from './grouping';
import type { Filtering } from './filtering';
import type { SearchFuzzy } from './searchFuzzy';
import RecordSummaryStore from './record-summaries/RecordSummaryStore';

export interface RecordsRequestParamsData {
  pagination: Pagination;
  sorting: Sorting;
  grouping: GroupingRequest;
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

export interface RecordGroup {
  count: number;
  eqValue: ApiGroup['eq_value'];
  firstValue: ApiGroup['first_value'];
  lastValue: ApiGroup['last_value'];
  resultIndices: number[];
}

export interface RecordGrouping {
  columnIds: number[];
  preprocIds: (string | null)[];
  mode: GroupingMode;
  groups: RecordGroup[];
}

function buildGroup(apiGroup: ApiGroup): RecordGroup {
  return {
    count: apiGroup.count,
    eqValue: apiGroup.eq_value,
    firstValue: apiGroup.first_value,
    lastValue: apiGroup.last_value,
    resultIndices: apiGroup.result_indices,
  };
}

function buildGrouping(apiGrouping: ApiGrouping): RecordGrouping {
  return {
    columnIds: apiGrouping.columns,
    preprocIds: apiGrouping.preproc ?? [],
    mode: apiGrouping.mode,
    groups: apiGrouping.groups.map(buildGroup),
  };
}

interface BaseRow {
  identifier: string;
}

export interface RecordRow extends BaseRow {
  rowIndex: number;
  record: ApiRecord;
}

export interface NewRecordRow extends RecordRow {
  isNew: true;
}

export interface GroupHeaderRow extends BaseRow {
  group: RecordGroup;
  groupValues: ApiGroup['first_value'];
}

export interface HelpTextRow extends BaseRow {
  isNewHelpText: true;
}

export interface PlaceholderRow extends NewRecordRow {
  isAddPlaceholder: true;
}

export type Row =
  | RecordRow
  | NewRecordRow
  | GroupHeaderRow
  | HelpTextRow
  | PlaceholderRow;

export function rowHasRecord(
  row: Row,
): row is RecordRow | NewRecordRow | PlaceholderRow {
  return 'record' in row;
}

export function rowHasNewRecord(
  row: Row,
): row is NewRecordRow | PlaceholderRow {
  return 'record' in row && 'isNew' in row && row.isNew;
}

export function isHelpTextRow(row: Row): row is HelpTextRow {
  return 'isNewHelpText' in row;
}

export function isGroupHeaderRow(row: Row): row is GroupHeaderRow {
  return 'group' in row;
}

export function isPlaceholderRow(row: Row): row is PlaceholderRow {
  return 'isAddPlaceholder' in row;
}

export function isNewRecordRow(row: Row): row is NewRecordRow {
  return rowHasNewRecord(row) && !isPlaceholderRow(row);
}

export function filterRecordRows(rows: Row[]): RecordRow[] {
  return rows.filter((row): row is RecordRow => rowHasRecord(row));
}

export function rowHasSavedRecord(row: Row): row is RecordRow {
  return rowHasRecord(row) && Object.entries(row.record).length > 0;
}

export interface TableRecordsData {
  state: States;
  error?: string;
  savedRecords: Row[];
  totalCount: number;
  grouping?: RecordGrouping;
}

export function getRowKey(row: Row, primaryKeyColumnId?: Column['id']): string {
  if (rowHasRecord(row) && primaryKeyColumnId !== undefined) {
    const primaryKeyCellValue = row.record[primaryKeyColumnId];
    if (isDefinedNonNullable(primaryKeyCellValue)) {
      return String(primaryKeyCellValue);
    }
  }
  if (rowHasNewRecord(row)) {
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

function getProcessedRecordRow(
  record: ApiRecord,
  recordIndex: number,
  offset: number,
): RecordRow {
  return {
    record,
    identifier: generateRowIdentifier('normal', offset, recordIndex),
    rowIndex: recordIndex,
  };
}

function preprocessRecords({
  records,
  offset,
  grouping,
}: {
  records: ApiRecord[];
  offset: number;
  grouping?: RecordGrouping;
}): (RecordRow | GroupHeaderRow)[] {
  const groupingColumnIds = grouping?.columnIds ?? [];
  const isResultGrouped = groupingColumnIds.length > 0;

  if (isResultGrouped) {
    const combinedRecords: (RecordRow | GroupHeaderRow)[] = [];
    let recordIndex = 0;

    grouping?.groups.forEach((group, groupIndex) => {
      const groupValues: ApiRecord = {};
      grouping.columnIds.forEach((columnId) => {
        if (group.eqValue[columnId] !== undefined) {
          groupValues[columnId] = group.eqValue[columnId];
        } else {
          groupValues[columnId] = group.firstValue[columnId];
        }
      });
      combinedRecords.push({
        group,
        identifier: generateRowIdentifier('groupHeader', offset, groupIndex),
        groupValues,
      });
      group.resultIndices.forEach((resultIndex) => {
        const record = records[resultIndex];
        combinedRecords.push(
          getProcessedRecordRow(record, recordIndex, offset),
        );
        recordIndex += 1;
      });
    });
    return combinedRecords;
  }

  return records.map((record, index) =>
    getProcessedRecordRow(record, index, offset),
  );
}

export class RecordsData {
  private parentId: DBObjectEntry['id'];

  private url: string;

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  savedRecords: Writable<(RecordRow | GroupHeaderRow)[]>;

  newRecords: Writable<NewRecordRow[]>;

  recordSummaries = new RecordSummaryStore();

  grouping: Writable<RecordGrouping | undefined>;

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
      if (response.preview_data) {
        this.recordSummaries.setFetchedSummaries(
          buildRecordSummariesForSheet(response.preview_data),
        );
      }
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

  async deleteSelected(selectedRowsKey: number[]): Promise<void> {
    const rowKeys = selectedRowsKey.map((key) => String(key));

    if (rowKeys.length > 0) {
      this.meta.rowDeletionStatus.setMultiple(rowKeys, { state: 'processing' });

      const successRowKeys = new Set<RowKey>();
      /** Values are error messages */
      const failures = new Map<RowKey, string>();
      // TODO: Convert this to single request
      const promises = rowKeys.map((pk) =>
        deleteAPI<RowKey>(`${this.url}${pk}/`)
          .then(() => {
            successRowKeys.add(pk);
            return successRowKeys;
          })
          .catch((error: unknown) => {
            failures.set(pk, getErrorMessage(error));
            return failures;
          }),
      );
      await Promise.all(promises);
      await this.fetch(true);

      const { offset } = getStoreValue(this.meta.pagination);
      const savedRecords = getStoreValue(this.savedRecords);
      const savedRecordsLength = savedRecords?.length || 0;
      const pkColumnId = this.columnsDataStore.get()?.primaryKeyColumnId;
      const savedRecordKeys = new Set(
        savedRecords.map((row) => getRowKey(row, pkColumnId)),
      );

      this.newRecords.update((existing) => {
        let retained = existing.filter(
          (row) => !successRowKeys.has(getRowKey(row, pkColumnId)),
        );
        retained = retained.filter(
          (row) => !savedRecordKeys.has(getRowKey(row, pkColumnId)),
        );

        if (retained.length === existing.length) {
          return existing;
        }
        let index = -1;
        retained = retained.map((row) => {
          index += 1;
          return {
            ...row,
            rowIndex: savedRecordsLength + index,
            identifier: generateRowIdentifier('new', offset, index),
          };
        });
        return retained;
      });
      this.meta.rowCreationStatus.delete([...savedRecordKeys]);
      this.meta.rowCreationStatus.delete([...successRowKeys]);
      this.meta.rowDeletionStatus.delete([...successRowKeys]);
      // this.meta.selectedRows.delete([...successRowKeys]);
      this.meta.rowDeletionStatus.setEntries(
        [...failures.entries()].map(([rowKey, errorMsg]) => [
          rowKey,
          { state: 'failure', errors: [errorMsg] },
        ]),
      );
    }
  }

  // TODO: It would be better to throw errors instead of silently failing
  // and returning a value.
  async updateCell(
    row: RecordRow | NewRecordRow | PlaceholderRow,
    column: Column,
  ): Promise<RecordRow> {
    // TODO compute and validate client side errors before saving
    const { record } = row;
    const { primaryKeyColumnId } = this.columnsDataStore.get();
    if (primaryKeyColumnId === undefined) {
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
    const promise = patchAPI<ApiRecordsResponse>(
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
        record: result.results[0],
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

  getNewEmptyRecord(): NewRecordRow {
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

  private async createRecord(
    row: NewRecordRow | PlaceholderRow,
  ): Promise<NewRecordRow> {
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
    const promise = postAPI<ApiRecordsResponse>(this.url, row.record);
    if (!this.createPromises) {
      this.createPromises = new Map();
    }
    this.createPromises.set(rowKeyOfBlankRow, promise);

    try {
      const response = await promise;
      const record = response.results[0];
      let newRow: NewRecordRow = {
        ...row,
        record,
      };
      if (isPlaceholderRow(newRow)) {
        const { isAddPlaceholder, ...newRecordRow } = newRow;
        newRow = newRecordRow;
      }

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

  async createOrUpdateRecord(
    row: RecordRow | NewRecordRow | PlaceholderRow,
    column: Column,
  ): Promise<RecordRow | NewRecordRow> {
    const { primaryKeyColumnId } = this.columnsDataStore.get();

    // Row may not have been updated yet in view when additional request is made.
    // So check current values to ensure another row has not been created.
    const existingNewRecordRow = getStoreValue(this.newRecords).find(
      (entry) => entry.identifier === row.identifier,
    );

    if (!existingNewRecordRow && isPlaceholderRow(row)) {
      this.newRecords.update((existing) => {
        const { isAddPlaceholder: unused, ...newRow } = row;
        existing.push({
          ...newRow,
          isNew: true,
        });
        return existing;
      });
    }

    let result: RecordRow;
    if (
      primaryKeyColumnId &&
      existingNewRecordRow?.record[primaryKeyColumnId] === undefined &&
      rowHasNewRecord(row) &&
      row.record[primaryKeyColumnId] === undefined
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

  getRecordRows(): RecordRow[] {
    const savedRecordRows = getStoreValue(this.savedRecords).filter(
      (row): row is RecordRow => !isGroupHeaderRow(row),
    );

    return [...savedRecordRows, ...getStoreValue(this.newRecords)];
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;

    this.requestParamsUnsubscriber();
  }
}
