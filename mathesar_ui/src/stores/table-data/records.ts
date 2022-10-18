import {
  writable,
  type Readable,
  type Writable,
  type Unsubscriber,
  derived,
  get,
} from 'svelte/store';
import {
  States,
  getAPI,
  deleteAPI,
  patchAPI,
  postAPI,
} from '@mathesar/utils/api';
import {
  isDefinedNonNullable,
  type CancellablePromise,
  getGloballyUniqueId,
} from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type {
  Result as ApiRecord,
  Response as ApiRecordsResponse,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  GroupingMode,
  DataForRecordSummariesInFkColumn,
  GetRequestParams as ApiGetRequestParams,
} from '@mathesar/api/tables/records';
import type { Column } from '@mathesar/api/tables/columns';
import { getErrorMessage } from '@mathesar/utils/errors';
import type Pagination from '@mathesar/utils/Pagination';
import type { DataForRecordSummaryInFkCell } from '@mathesar/utils/recordSummaryTypes';
import type { Meta } from './meta';
import type { RowKey } from './utils';
import { validateRow, getCellKey } from './utils';
import type { ColumnsDataStore } from './columns';
import type { Sorting } from './sorting';
import type { Grouping as GroupingRequest } from './grouping';
import type { Filtering } from './filtering';
import type { SearchFuzzy } from './searchFuzzy';

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
/** Keys are stringified column ids */
type DataForRecordSummariesInFkColumns = Record<
  string,
  DataForRecordSummariesInFkColumn
>;

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

type DataForRecordSummariesInRow = Record<string, DataForRecordSummaryInFkCell>;

interface BaseRow {
  identifier: string;
}

export interface RecordRow extends BaseRow {
  rowIndex: number;
  record: ApiRecord;
  dataForRecordSummariesInRow?: DataForRecordSummariesInRow;
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
  savedRecordRowsWithGroupHeaders: Row[];
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
  return row.identifier;
}

function generateRowIdentifier(
  type: 'groupHeader' | 'normal' | 'dummy' | 'new',
  offset: number,
  reference: number | string,
): string {
  return `__${offset}_${type}_${reference}`;
}

function getProcessedRecordRow(
  record: ApiRecord,
  recordIndex: number,
  offset: number,
  dataForRecordSummariesInFkColumns?: DataForRecordSummariesInFkColumns,
): RecordRow {
  const dataForRecordSummariesInRow: DataForRecordSummariesInRow | undefined =
    dataForRecordSummariesInFkColumns
      ? Object.entries(dataForRecordSummariesInFkColumns).reduce(
          (fkColumnSummaryRecord, [columnId, summaryObj]) => ({
            ...fkColumnSummaryRecord,
            [columnId]: { ...summaryObj, data: summaryObj.data[recordIndex] },
          }),
          {},
        )
      : undefined;
  return {
    record,
    dataForRecordSummariesInRow,
    identifier: generateRowIdentifier('normal', offset, recordIndex),
    rowIndex: recordIndex,
  };
}

function preprocessRecords({
  records,
  offset,
  grouping,
  dataForRecordSummariesInFkColumns,
}: {
  records: ApiRecord[];
  offset: number;
  grouping?: RecordGrouping;
  dataForRecordSummariesInFkColumns?: DataForRecordSummariesInFkColumns;
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
          getProcessedRecordRow(
            record,
            recordIndex,
            offset,
            dataForRecordSummariesInFkColumns,
          ),
        );
        recordIndex += 1;
      });
    });
    return combinedRecords;
  }

  return records.map((record, index) =>
    getProcessedRecordRow(
      record,
      index,
      offset,
      dataForRecordSummariesInFkColumns,
    ),
  );
}

export class RecordsData {
  private parentId: DBObjectEntry['id'];

  private url: string;

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  savedRecords: Readable<RecordRow[]>;

  savedRecordRowsWithGroupHeaders: Writable<(RecordRow | GroupHeaderRow)[]>;

  newRecords: Writable<NewRecordRow[]>;

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

  /**
   * This maps column ids to cell values. It is used to supply default values
   * for the cells within hidden columns when creating new records.
   */
  private contextualFilters: Map<number, number | string>;

  constructor(
    parentId: number,
    meta: Meta,
    columnsDataStore: ColumnsDataStore,
    contextualFilters: Map<number, number | string>,
  ) {
    this.parentId = parentId;

    this.state = writable(States.Loading);
    this.savedRecordRowsWithGroupHeaders = writable([]);
    this.newRecords = writable([]);
    this.savedRecords = derived(
      this.savedRecordRowsWithGroupHeaders,
      ($savedRecordRowsWithGroupHeaders) =>
        $savedRecordRowsWithGroupHeaders.filter(
          (row): row is RecordRow => !isGroupHeaderRow(row),
        ),
    );
    this.grouping = writable(undefined);
    this.totalCount = writable(undefined);
    this.error = writable(undefined);

    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.contextualFilters = contextualFilters;
    this.url = `/api/db/v0/tables/${this.parentId}/records/`;
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
    const { offset } = get(this.meta.pagination);

    this.savedRecordRowsWithGroupHeaders.update((existingData) => {
      let data = [...existingData];
      data.length = Math.min(data.length, get(this.meta.pagination).size);

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
      this.meta.clearAllStatusesAndErrors();
    }

    try {
      const params = get(this.meta.recordsRequestParamsData);
      const queryString = buildFetchQueryString(params);
      this.promise = getAPI<ApiRecordsResponse>(`${this.url}?${queryString}`);
      const response = await this.promise;
      const totalCount = response.count || 0;
      const grouping = response.grouping
        ? buildGrouping(response.grouping)
        : undefined;
      // Converting an array to a map type as it would be easier to reference
      const dataForRecordSummariesInFkColumns: DataForRecordSummariesInFkColumns =
        (response.preview_data ?? []).reduce(
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
        dataForRecordSummariesInFkColumns,
      });

      const tableRecordsData: TableRecordsData = {
        state: States.Done,
        savedRecordRowsWithGroupHeaders: records,
        grouping,
        totalCount,
      };
      this.savedRecordRowsWithGroupHeaders.set(records);
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

  async deleteSelected(selectedRowIndices: number[]): Promise<void> {
    const recordRows = this.getRecordRows();
    const pkColumn = get(this.columnsDataStore.pkColumn);
    const primaryKeysOfSavedRows: string[] = [];
    const identifiersOfUnsavedRows: string[] = [];
    selectedRowIndices.forEach((index) => {
      const row = recordRows[index];
      if (row) {
        const rowKey = getRowKey(row, pkColumn?.id);
        if (pkColumn?.id && isDefinedNonNullable(row.record[pkColumn?.id])) {
          primaryKeysOfSavedRows.push(rowKey);
        } else {
          identifiersOfUnsavedRows.push(rowKey);
        }
      }
    });
    const rowKeys = [...primaryKeysOfSavedRows, ...identifiersOfUnsavedRows];

    if (rowKeys.length > 0) {
      this.meta.rowDeletionStatus.setMultiple(rowKeys, { state: 'processing' });

      const successRowKeys = new Set<RowKey>();
      /** Values are error messages */
      const failures = new Map<RowKey, string>();

      if (identifiersOfUnsavedRows.length > 0) {
        identifiersOfUnsavedRows.forEach((identifier) =>
          successRowKeys.add(identifier),
        );
      }
      if (primaryKeysOfSavedRows.length > 0) {
        // TODO: Convert this to single request
        const promises = primaryKeysOfSavedRows.map((pk) =>
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
      }

      const savedRecords = get(this.savedRecords);
      const savedRecordsLength = savedRecords.length;
      const savedRecordKeys = new Set(
        savedRecords.map((row) => getRowKey(row, pkColumn?.id)),
      );

      this.newRecords.update((existing) => {
        const retained = existing.filter((row) => {
          const rowKey = getRowKey(row, pkColumn?.id);
          return !successRowKeys.has(rowKey) && !savedRecordKeys.has(rowKey);
        });
        if (retained.length === existing.length) {
          return existing;
        }
        return retained.map((row, index) => ({
          ...row,
          rowIndex: savedRecordsLength + index,
        }));
      });
      this.meta.rowCreationStatus.delete([...savedRecordKeys]);
      this.meta.clearAllStatusesAndErrorsForRows([...successRowKeys]);
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
    const pkColumn = get(this.columnsDataStore.pkColumn);
    if (pkColumn === undefined) {
      // eslint-disable-next-line no-console
      console.error('Unable to update record for a row without a primary key');
      return row;
    }
    const primaryKeyValue = record[pkColumn.id];
    if (primaryKeyValue === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'Unable to update record for a row with a missing primary key value',
      );
      return row;
    }
    const rowKey = getRowKey(row, pkColumn.id);
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
    const { offset } = get(this.meta.pagination);
    const existingRecordRows = this.getRecordRows();
    const identifier = generateRowIdentifier(
      'new',
      offset,
      getGloballyUniqueId(),
    );
    const record = Object.fromEntries(
      get(this.columnsDataStore.columns)
        .filter((column) => column.default === null)
        .map((column) => [String(column.id), null]),
    );
    const newRow: Row = {
      record,
      identifier,
      isNew: true,
      rowIndex: existingRecordRows.length,
    };
    return newRow;
  }

  private async createRecord(
    row: NewRecordRow | PlaceholderRow,
  ): Promise<NewRecordRow> {
    const pkColumn = get(this.columnsDataStore.pkColumn);
    const columns = get(this.columnsDataStore.columns);
    const rowKey = getRowKey(row, pkColumn?.id);
    validateRow({
      row,
      rowKey,
      columns,
      cellClientSideErrors: this.meta.cellClientSideErrors,
    });
    if (get(this.meta.rowsWithClientSideErrors).has(rowKey)) {
      return row;
    }

    const rowKeyOfBlankRow = getRowKey(row, pkColumn?.id);
    this.meta.rowCreationStatus.set(rowKeyOfBlankRow, { state: 'processing' });
    this.createPromises?.get(rowKeyOfBlankRow)?.cancel();
    const requestRecord = {
      ...Object.fromEntries(this.contextualFilters),
      ...row.record,
    };
    const promise = postAPI<ApiRecordsResponse>(this.url, requestRecord);
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

      const rowKeyWithRecord = getRowKey(newRow, pkColumn?.id);
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
    const pkColumn = get(this.columnsDataStore.pkColumn);

    // Row may not have been updated yet in view when additional request is made.
    // So check current values to ensure another row has not been created.
    const existingNewRecordRow = get(this.newRecords).find(
      (entry) => entry.identifier === row.identifier,
    );

    if (!existingNewRecordRow && isPlaceholderRow(row)) {
      this.newRecords.update((existing) => {
        const { isAddPlaceholder: unused, ...newRow } = row;
        return [...existing, newRow];
      });
    }

    let result: RecordRow;
    if (
      pkColumn?.id &&
      rowHasNewRecord(row) &&
      row.record[pkColumn?.id] === undefined
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

  getRecordRows(): RecordRow[] {
    return [...get(this.savedRecords), ...get(this.newRecords)];
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;

    this.requestParamsUnsubscriber();
  }
}
