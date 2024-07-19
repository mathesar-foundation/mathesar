import {
  type Readable,
  type Unsubscriber,
  type Writable,
  derived,
  get,
  writable,
} from 'svelte/store';

import type { Table } from '@mathesar/api/rest/types/tables';
import type { Column } from '@mathesar/api/rest/types/tables/columns';
import type {
  GetRequestParams as ApiGetRequestParams,
  Group as ApiGroup,
  Grouping as ApiGrouping,
  Result as ApiRecord,
  Response as ApiRecordsResponse,
  GroupingMode,
} from '@mathesar/api/rest/types/tables/records';
import {
  States,
  deleteAPI,
  getAPI,
  getQueryStringFromParams,
  patchAPI,
  postAPI,
} from '@mathesar/api/rest/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';
import { pluralize } from '@mathesar/utils/languageUtils';
import type Pagination from '@mathesar/utils/Pagination';
import type { ShareConsumer } from '@mathesar/utils/shares';
import {
  type CancellablePromise,
  getGloballyUniqueId,
  isDefinedNonNullable,
} from '@mathesar-component-library';

import type { ColumnsDataStore } from './columns';
import type { Filtering } from './filtering';
import type { Grouping as GroupingRequest } from './grouping';
import type { Meta } from './meta';
import RecordSummaryStore from './record-summaries/RecordSummaryStore';
import { buildRecordSummariesForSheet } from './record-summaries/recordSummaryUtils';
import type { SearchFuzzy } from './searchFuzzy';
import type { Sorting } from './sorting';
import type { RowKey } from './utils';
import { getCellKey, validateRow } from './utils';

export interface RecordsRequestParamsData {
  pagination: Pagination;
  sorting: Sorting;
  grouping: GroupingRequest;
  filtering: Filtering;
  searchFuzzy: SearchFuzzy;
}

interface RecordsFetchQueryParamsData extends RecordsRequestParamsData {
  shareConsumer?: ShareConsumer;
}

function buildFetchQueryString(data: RecordsFetchQueryParamsData): string {
  const params: ApiGetRequestParams = {
    ...data.pagination.recordsRequestParams(),
    ...data.sorting.recordsRequestParamsIncludingGrouping(data.grouping),
    ...data.grouping.recordsRequestParams(),
    ...data.filtering.recordsRequestParams(),
    ...data.searchFuzzy.recordsRequestParams(),
  };
  const paramsWithShareConsumer = {
    ...params,
    ...data.shareConsumer?.getQueryParams(),
  };
  return getQueryStringFromParams(paramsWithShareConsumer);
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
    groups: (apiGrouping.groups ?? []).map(buildGroup),
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
  savedRecordRowsWithGroupHeaders: Row[];
  totalCount: number;
  grouping?: RecordGrouping;
}

export function getRowSelectionId(row: Row): string {
  return row.identifier;
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

export function getPkValueInRecord(
  record: ApiRecord,
  columns: Column[],
): string | number {
  const pkColumn = columns.find((c) => c.primary_key);
  if (!pkColumn) {
    throw new Error('No primary key column found.');
  }
  const pkValue = record[pkColumn.id];
  if (!(typeof pkValue === 'string' || typeof pkValue === 'number')) {
    throw new Error('Primary key value is not a string or number.');
  }
  return pkValue;
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
  private tableId: Table['oid'];

  private url: string;

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  savedRecords: Readable<RecordRow[]>;

  savedRecordRowsWithGroupHeaders: Writable<(RecordRow | GroupHeaderRow)[]>;

  newRecords: Writable<NewRecordRow[]>;

  recordSummaries = new RecordSummaryStore();

  grouping: Writable<RecordGrouping | undefined>;

  totalCount: Writable<number | undefined>;

  error: Writable<string | undefined>;

  /** Keys are row selection ids */
  selectableRowsMap: Readable<Map<string, RecordRow>>;

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

  readonly shareConsumer?: ShareConsumer;

  constructor({
    tableId,
    meta,
    columnsDataStore,
    contextualFilters,
    shareConsumer,
  }: {
    tableId: Table['oid'];
    meta: Meta;
    columnsDataStore: ColumnsDataStore;
    contextualFilters: Map<number, number | string>;
    shareConsumer?: ShareConsumer;
  }) {
    this.tableId = tableId;
    this.shareConsumer = shareConsumer;
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
    this.url = `/api/db/v0/tables/${this.tableId}/records/`;
    void this.fetch();

    this.selectableRowsMap = derived(
      [this.savedRecords, this.newRecords],
      ([savedRecords, newRecords]) => {
        const records = [...savedRecords, ...newRecords];
        return new Map(records.map((r) => [getRowSelectionId(r), r]));
      },
    );

    // TODO: Create base class to abstract subscriptions and unsubscriptions
    this.requestParamsUnsubscriber =
      this.meta.recordsRequestParamsData.subscribe(() => {
        void this.fetch();
      });
  }

  async fetch(
    opts: {
      clearNewRecords?: boolean;
      setLoadingState?: boolean;
      clearMetaStatuses?: boolean;
    } = {},
  ): Promise<TableRecordsData | undefined> {
    const options = {
      clearNewRecords: true,
      setLoadingState: true,
      clearMetaStatuses: true,
      ...opts,
    };

    this.promise?.cancel();
    const { offset } = get(this.meta.pagination);

    this.error.set(undefined);

    if (options.clearNewRecords) {
      this.newRecords.set([]);
    }
    if (options.setLoadingState) {
      this.state.set(States.Loading);
    }
    if (options.clearMetaStatuses) {
      this.meta.clearAllStatusesAndErrors();
    }

    try {
      const params = get(this.meta.recordsRequestParamsData);
      const contextualFilterEntries = [...this.contextualFilters].map(
        ([columnId, value]) => ({ columnId, conditionId: 'equal', value }),
      );
      const queryString = buildFetchQueryString({
        ...params,
        filtering: params.filtering.withEntries(contextualFilterEntries),
        shareConsumer: this.shareConsumer,
      });
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

  async deleteSelected(rowSelectionIds: Iterable<string>): Promise<void> {
    const ids =
      typeof rowSelectionIds === 'string' ? [rowSelectionIds] : rowSelectionIds;
    const pkColumn = get(this.columnsDataStore.pkColumn);
    const primaryKeysOfSavedRows: string[] = [];
    const identifiersOfUnsavedRows: string[] = [];
    const selectableRows = get(this.selectableRowsMap);
    for (const rowId of ids) {
      const row = selectableRows.get(rowId);
      if (!row) continue;
      const rowKey = getRowKey(row, pkColumn?.id);
      if (pkColumn?.id && isDefinedNonNullable(row.record[pkColumn?.id])) {
        primaryKeysOfSavedRows.push(rowKey);
      } else {
        identifiersOfUnsavedRows.push(rowKey);
      }
    }
    const rowKeys = [...primaryKeysOfSavedRows, ...identifiersOfUnsavedRows];

    if (rowKeys.length === 0) {
      return;
    }

    this.meta.rowDeletionStatus.setMultiple(rowKeys, { state: 'processing' });

    const successRowKeys = new Set<RowKey>();
    /** Values are error messages */
    const failures = new Map<RowKey, string>();

    if (identifiersOfUnsavedRows.length > 0) {
      identifiersOfUnsavedRows.forEach((identifier) =>
        successRowKeys.add(identifier),
      );
    }

    const keysToDelete = primaryKeysOfSavedRows;

    let shouldReFetchRecords = successRowKeys.size > 0;
    if (keysToDelete.length > 0) {
      const recordIds = [...keysToDelete];
      const bulkDeleteURL = `/api/ui/v0/tables/${this.tableId}/records/delete/`;
      try {
        await deleteAPI<RowKey>(bulkDeleteURL, { pks: recordIds });
        keysToDelete.forEach((key) => successRowKeys.add(key));
      } catch (error) {
        failures.set(keysToDelete.join(','), getErrorMessage(error));
      }
      shouldReFetchRecords = true;
    }

    const savedRecords = get(this.savedRecords);
    const savedRecordKeys = new Set(
      savedRecords.map((row) => getRowKey(row, pkColumn?.id)),
    );

    // We clear all records from the new records section because we expect that
    // those records will be re-fetched and end up in the main table area. This
    // expectation doesn't always hold though. Sometimes the new record section
    // contains records that haven't yet been saved (e.g. when a record has a
    // NOT NULL constraint). In that case we delete the unsaved records anyway,
    // just because that's simpler. We have some opportunity for UX improvement
    // here, and we should discuss the subtleties of our desired behavior when
    // deleting records.
    this.newRecords.set([]);

    // It's important that we update `newRecords` before we re-fetch, otherwise
    // we could end up with duplicate records that cause JS errors due to
    // svelte's keyed each block. Duplicates can occur if the user creates two
    // records and then deletes one of them, leaving a new records in the
    // `newRecords` array that also gets re-fetched. It's also important that we
    // update `newRecords` regardless of wether we had any _saved_ records to
    // delete, because sometimes the user is just deleting an unsaved record.
    // These reasons together are why we're using this `shouldReFetchRecords`
    // flag instead of just re-fetching the records immediately after deleting
    // the saved records.
    if (shouldReFetchRecords) {
      await this.fetch({
        clearMetaStatuses: false,
        clearNewRecords: false,
        setLoadingState: false,
      });
    }

    this.meta.rowCreationStatus.delete(Array.from(savedRecordKeys, String));
    this.meta.clearAllStatusesAndErrorsForRows([...successRowKeys]);
    this.meta.rowDeletionStatus.setEntries(
      [...failures.entries()].map(([rowKey, errorMsg]) => [
        rowKey,
        { state: 'failure', errors: [errorMsg] },
      ]),
    );
    this.meta.rowDeletionStatus.clear();

    if (failures.size > 0) {
      const uiMsg = `Unable to delete ${pluralize(keysToDelete, 'rows')}.`;
      const apiMsg = [...failures.values()].join('\n');
      throw new Error(`${uiMsg} ${apiMsg}`);
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
