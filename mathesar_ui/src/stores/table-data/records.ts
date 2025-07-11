import { execPipe, first, map, zip } from 'iter-tools';
import {
  type Readable,
  type Unsubscriber,
  type Writable,
  derived,
  get,
  writable,
} from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type {
  Result as ApiRecord,
  RecordsListParams,
  RecordsResponse,
  RecordsSearchParams,
  ResultValue,
} from '@mathesar/api/rpc/records';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import {
  RpcError,
  batchSend,
} from '@mathesar/packages/json-rpc-client-builder';
import { pluralize } from '@mathesar/utils/languageUtils';
import type Pagination from '@mathesar/utils/Pagination';
import type { ShareConsumer } from '@mathesar/utils/shares';
import {
  type CancellablePromise,
  ImmutableMap,
  WritableMap,
} from '@mathesar-component-library';

import type { ColumnsDataStore } from './columns';
import type { FilterEntry, Filtering } from './filtering';
import type { Grouping as GroupingRequest } from './grouping';
import type { Meta } from './meta';
import RecordSummaryStore from './record-summaries/RecordSummaryStore';
import {
  type RecordSummariesForSheet,
  buildRecordSummariesForSheet,
  mergeRecordSummariesForSheet,
} from './record-summaries/recordSummaryUtils';
import {
  DraftRecordRow,
  PersistedRecordRow,
  type RecordRow,
  type Row,
  isDraftRecordRow,
  isPersistedRecordRow,
  isPlaceholderRecordRow,
} from './Row';
import type { SearchFuzzy } from './searchFuzzy';
import type { Sorting } from './sorting';
import {
  type RecordGrouping,
  type RowKey,
  buildGrouping,
  getCellKey,
  getRowSelectionId,
  validateRow,
} from './utils';

export interface RecordsRequestParamsData {
  pagination: Pagination;
  sorting: Sorting;
  grouping: GroupingRequest;
  filtering: Filtering;
  searchFuzzy: SearchFuzzy;
}

export interface TableRecordsData {
  state: States;
  error?: string;
  rows: Row[];
  totalCount: number;
  grouping?: RecordGrouping;
}

export class RecordsData {
  private apiContext: {
    database_id: number;
    table_oid: Table['oid'];
  };

  private meta: Meta;

  private columnsDataStore: ColumnsDataStore;

  state: Writable<States>;

  fetchedRecordRows: Writable<PersistedRecordRow[]>;

  newRecords: Writable<(PersistedRecordRow | DraftRecordRow)[]>;

  persistedNewRecords: Readable<PersistedRecordRow[]>;

  recordSummaries = new WritableMap<string, string>();

  linkedRecordSummaries = new RecordSummaryStore();

  grouping: Writable<RecordGrouping | undefined>;

  totalCount: Writable<number | undefined>;

  error: Writable<string | undefined>;

  /** Keys are row selection ids */
  selectableRowsMap: Readable<Map<string, PersistedRecordRow | DraftRecordRow>>;

  private promise: CancellablePromise<RecordsResponse> | undefined;

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  private createPromises: Map<unknown, CancellablePromise<unknown>>;

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  private updatePromises: Map<unknown, CancellablePromise<unknown>>;

  private requestParamsUnsubscriber: Unsubscriber;

  /**
   * This maps column ids to cell values. It is used to supply default values
   * for the cells within hidden columns when creating new records.
   */
  private contextualFilters: Map<number, number | string>;

  readonly shareConsumer?: ShareConsumer;

  private loadIntrinsicRecordSummaries?: boolean;

  constructor({
    database,
    table,
    meta,
    columnsDataStore,
    contextualFilters,
    loadIntrinsicRecordSummaries,
  }: {
    database: Pick<Database, 'id'>;
    table: Pick<Table, 'oid'>;
    meta: Meta;
    columnsDataStore: ColumnsDataStore;
    contextualFilters: Map<number, number | string>;
    loadIntrinsicRecordSummaries?: boolean;
  }) {
    this.apiContext = { database_id: database.id, table_oid: table.oid };
    this.state = writable(States.Loading);
    this.fetchedRecordRows = writable([]);
    this.newRecords = writable([]);
    this.grouping = writable(undefined);
    this.totalCount = writable(undefined);
    this.error = writable(undefined);
    this.meta = meta;
    this.columnsDataStore = columnsDataStore;
    this.contextualFilters = contextualFilters;
    this.loadIntrinsicRecordSummaries = loadIntrinsicRecordSummaries;

    void this.fetch();

    this.selectableRowsMap = derived(
      [this.fetchedRecordRows, this.newRecords],
      ([fetchedRecordRows, newRecords]) => {
        const records = [...fetchedRecordRows, ...newRecords];
        return new Map(records.map((r) => [getRowSelectionId(r), r]));
      },
    );

    this.persistedNewRecords = derived(this.newRecords, (newRecords) =>
      newRecords.filter((row): row is PersistedRecordRow =>
        isPersistedRecordRow(row),
      ),
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
  ): Promise<void> {
    const options = {
      clearNewRecords: true,
      setLoadingState: true,
      clearMetaStatuses: true,
      ...opts,
    };

    this.promise?.cancel();
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
      const contextualFilterEntries: FilterEntry[] = [
        ...this.contextualFilters,
      ].map(([columnId, value]) => ({ columnId, conditionId: 'equal', value }));

      const recordsListParams: RecordsListParams = {
        ...this.apiContext,
        ...params.pagination.recordsRequestParams(),
        ...params.sorting.recordsRequestParamsIncludingGrouping(
          params.grouping,
        ),
        ...params.grouping.recordsRequestParams(),
        ...params.filtering
          .withEntries(contextualFilterEntries)
          .recordsRequestParams(),
        return_record_summaries: this.loadIntrinsicRecordSummaries,
      };

      const fuzzySearchParams = params.searchFuzzy.getSearchParams();
      const recordSearchParams: RecordsSearchParams = {
        ...this.apiContext,
        ...params.pagination.recordsRequestParams(),
        search_params: fuzzySearchParams,
        return_record_summaries: this.loadIntrinsicRecordSummaries,
      };

      this.promise = fuzzySearchParams.length
        ? api.records.search(recordSearchParams).run()
        : api.records.list(recordsListParams).run();

      const response = await this.promise;
      const totalCount = response.count || 0;
      const grouping = response.grouping
        ? buildGrouping(response.grouping)
        : undefined;
      if (response.linked_record_summaries) {
        this.linkedRecordSummaries.setFetchedSummaries(
          buildRecordSummariesForSheet(response.linked_record_summaries),
        );
      }
      if (response.record_summaries) {
        this.recordSummaries.reconstruct(
          Object.entries(response.record_summaries),
        );
      }
      this.fetchedRecordRows.set(
        response.results.map(
          (apiRecord) =>
            new PersistedRecordRow({
              record: apiRecord,
            }),
        ),
      );
      this.state.set(States.Done);
      this.grouping.set(grouping);
      this.totalCount.set(totalCount);
      this.error.set(undefined);
    } catch (err) {
      this.state.set(States.Error);
      this.error.set(
        err instanceof Error ? err.message : 'Unable to load records',
      );
    }
    return undefined;
  }

  /** @returns the number of selected rows deleted */
  async deleteSelected(rowSelectionIds: Iterable<string>): Promise<number> {
    const pkColumn = get(this.columnsDataStore.pkColumn);
    if (!pkColumn) throw new Error('Cannot delete without primary key');

    const rowIds =
      typeof rowSelectionIds === 'string' ? [rowSelectionIds] : rowSelectionIds;
    const allSelectableRows = get(this.selectableRowsMap);

    const draftRowsToDelete: Map<string, DraftRecordRow> = new Map();
    const persistedRowsToDelete: Map<string, PersistedRecordRow> = new Map();

    for (const rowId of rowIds) {
      const row = allSelectableRows.get(rowId);
      if (!row) continue;

      if (isDraftRecordRow(row)) {
        draftRowsToDelete.set(row.identifier, row);
      } else {
        persistedRowsToDelete.set(row.identifier, row);
      }
    }

    if (!draftRowsToDelete.size && !persistedRowsToDelete.size) {
      return 0;
    }

    this.meta.rowDeletionStatus.setMultiple(
      [...draftRowsToDelete.keys(), ...persistedRowsToDelete.keys()],
      { state: 'processing' },
    );

    const rowsSuccessfullyDeleted = new Set<RowKey>(draftRowsToDelete.keys());

    /** Values are error messages */
    const rowsFailedToDelete = new Map<RowKey, RpcError>();

    if (persistedRowsToDelete.size) {
      const primaryKeysOfPersistedRows = [
        ...persistedRowsToDelete.values(),
      ].map((row) => row.record[pkColumn.id]);

      try {
        await api.records
          .delete({
            database_id: this.apiContext.database_id,
            table_oid: this.apiContext.table_oid,
            record_ids: primaryKeysOfPersistedRows,
          })
          .run();
        persistedRowsToDelete.forEach((row) =>
          rowsSuccessfullyDeleted.add(row.identifier),
        );
      } catch (error) {
        persistedRowsToDelete.forEach((row) =>
          rowsFailedToDelete.set(
            row.identifier,
            RpcError.fromAnything(RpcError),
          ),
        );
      }
    }
    const shouldReFetchRecords = rowsSuccessfullyDeleted.size > 0;

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

    this.meta.rowCreationStatus.delete(
      Array.from(rowsSuccessfullyDeleted, String),
    );
    this.meta.clearAllStatusesAndErrorsForRows([...rowsSuccessfullyDeleted]);
    this.meta.rowDeletionStatus.setEntries(
      [...rowsFailedToDelete.entries()].map(([rowKey, error]) => [
        rowKey,
        { state: 'failure', errors: [error] },
      ]),
    );
    this.meta.rowDeletionStatus.clear();

    if (rowsFailedToDelete.size > 0) {
      const uiMsg = `Unable to delete ${pluralize(
        rowsFailedToDelete.size,
        'rows',
      )}.`;
      const apiMsg = [...rowsFailedToDelete.values()].join('\n');
      throw new Error(`${uiMsg} ${apiMsg}`);
    }

    return draftRowsToDelete.size + persistedRowsToDelete.size;
  }

  async bulkUpdate(
    rowBlueprints: {
      row: RecordRow;
      cells: { columnId: string; value: unknown }[];
    }[],
  ): Promise<void> {
    const cellStatus = this.meta.cellModificationStatus;
    const { cellClientSideErrors, rowCreationStatus } = this.meta;

    function forEachRow(fn: (b: (typeof rowBlueprints)[number]) => void) {
      rowBlueprints.forEach(fn);
    }

    function forEachCell(fn: (cellKey: string) => void) {
      forEachRow((blueprint) =>
        blueprint.cells.forEach((cell) =>
          fn(getCellKey(blueprint.row.identifier, cell.columnId)),
        ),
      );
    }

    const pkColumn = get(this.columnsDataStore.pkColumn);
    if (!pkColumn) throw new Error('Unable to update without primary key');

    forEachRow(({ row }) => {
      const primaryKeyValue = row.record[pkColumn.id];
      if (isPersistedRecordRow(row) && primaryKeyValue === undefined) {
        throw new Error(
          'Unable to update record for a row with a missing primary key value',
        );
      }
    });

    forEachCell((cellKey) => {
      cellStatus.set(cellKey, { state: 'processing' });
      this.updatePromises?.get(cellKey)?.cancel();
    });
    forEachRow(({ row }) => {
      if (isDraftRecordRow(row)) {
        rowCreationStatus.set(row.identifier, { state: 'processing' });
      }
      this.updatePromises?.get(row.identifier)?.cancel();
    });

    const requests = rowBlueprints.map((blueprint) => {
      const recordDef = Object.fromEntries(
        blueprint.cells.map((cell) => [cell.columnId, cell.value]),
      );
      if (isDraftRecordRow(blueprint.row)) {
        return api.records.add({
          ...this.apiContext,
          record_def: recordDef,
        });
      }
      return api.records.patch({
        ...this.apiContext,
        record_id: blueprint.row.record[pkColumn.id],
        record_def: recordDef,
      });
    });

    const responses = await batchSend(requests);
    const responseMap = new Map(
      execPipe(
        zip(rowBlueprints, responses),
        map(([blueprint, response]) => [
          blueprint.row.identifier,
          { blueprint, response },
        ]),
      ),
    );

    /**
     * @returns the `RecordRow` we want to persist on the front end going
     * forward
     */
    function followUp<R extends RecordRow>(row: R): R {
      if (isDraftRecordRow(row)) {
        rowCreationStatus.delete(row.identifier);
      }
      const responseMapValue = responseMap.get(row.identifier);
      if (!responseMapValue) return row;
      const { blueprint, response } = responseMapValue;

      /** Generate a row using the blueprint instead of the API return value */
      function makeFallbackRow() {
        const updatedValues = Object.fromEntries(
          blueprint.cells.map(({ columnId, value }) => [
            columnId,
            value as ResultValue,
          ]),
        );
        return row.withRecord({ ...row.record, ...updatedValues }) as R;
      }

      if (response.status === 'error') {
        // NOTE: this is a bit weird and could potentially be improved. If we
        // were unable to save the record we need to indicate to the user that
        // all target cells in the record have failed to update. The code
        // below is a rather crude way of doing this. If one cells caused the
        // whole record to fail, then the error message will be repeated for
        // each cell in the record. We could potentially improve on this by
        // using our `extractDetailedFieldBasedErrors` utility. But we'd still
        // need to figure how to show some kind of errors in other cells.
        blueprint.cells.forEach((cell) => {
          const cellKey = getCellKey(row.identifier, cell.columnId);
          cellStatus.set(cellKey, {
            state: 'failure',
            errors: [response],
          });
        });
        return makeFallbackRow();
      }
      const result = first(response.value.results);
      if (!result) return makeFallbackRow();

      for (const columnId of Object.keys(row.record)) {
        const cellKey = getCellKey(row.identifier, columnId);
        cellStatus.set(cellKey, { state: 'success' });
        cellClientSideErrors.delete(cellKey);
      }

      if (isDraftRecordRow(row)) {
        return PersistedRecordRow.fromDraft(row.withRecord(result)) as R;
      }
      return row.withRecord(result) as R;
    }

    this.fetchedRecordRows.update((rows) => rows.map(followUp));
    this.newRecords.update((rows) => rows.map(followUp));

    let newRecordSummaries: RecordSummariesForSheet = new ImmutableMap();
    for (const response of responses) {
      if (response.status === 'error') continue;
      const linkedRecordSummaries = response.value.linked_record_summaries;
      if (!linkedRecordSummaries) continue;
      newRecordSummaries = mergeRecordSummariesForSheet(
        newRecordSummaries,
        buildRecordSummariesForSheet(linkedRecordSummaries),
      );
    }
    this.linkedRecordSummaries.addBespokeRecordSummaries(newRecordSummaries);
  }

  // TODO: it would be nice to refactor this function to utilize the
  // `bulkUpdate` function (which actually updates the store values too).
  async updateCell(
    row: PersistedRecordRow,
    column: RawColumnWithMetadata,
  ): Promise<PersistedRecordRow> {
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
    const cellKey = getCellKey(row.identifier, column.id);
    this.meta.cellModificationStatus.set(cellKey, { state: 'processing' });
    this.updatePromises?.get(cellKey)?.cancel();

    const promise = api.records
      .patch({
        ...this.apiContext,
        record_id: primaryKeyValue,
        record_def: {
          [String(column.id)]: record[column.id],
        },
      })
      .run();

    if (!this.updatePromises) {
      this.updatePromises = new Map();
    }
    this.updatePromises.set(cellKey, promise);

    try {
      const result = await promise;
      this.meta.cellModificationStatus.set(cellKey, { state: 'success' });
      return row.withRecord(result.results[0]);
    } catch (err) {
      this.meta.cellModificationStatus.set(cellKey, {
        state: 'failure',
        errors: [RpcError.fromAnything(err)],
      });
    } finally {
      if (this.updatePromises.get(cellKey) === promise) {
        this.updatePromises.delete(cellKey);
      }
    }
    return row;
  }

  getEmptyApiRecord(): ApiRecord {
    const record: ApiRecord = Object.fromEntries(
      get(this.columnsDataStore.columns)
        .filter((column) => column.default === null)
        .map((column) => [String(column.id), null]),
    );
    return record;
  }

  private async createRecord(
    row: DraftRecordRow,
  ): Promise<DraftRecordRow | PersistedRecordRow> {
    const columns = get(this.columnsDataStore.columns);
    validateRow({
      row,
      columns,
      cellClientSideErrors: this.meta.cellClientSideErrors,
    });
    if (get(this.meta.rowsWithClientSideErrors).has(row.identifier)) {
      return row;
    }

    this.meta.rowCreationStatus.set(row.identifier, { state: 'processing' });
    this.createPromises?.get(row.identifier)?.cancel();

    const promise = api.records
      .add({
        ...this.apiContext,
        record_def: {
          ...Object.fromEntries(this.contextualFilters),
          ...row.record,
        },
      })
      .run();

    if (!this.createPromises) {
      this.createPromises = new Map();
    }
    this.createPromises.set(row.identifier, promise);

    try {
      const response = await promise;
      const record = response.results[0];
      const newRow = PersistedRecordRow.fromDraft(row.withRecord(record));

      this.meta.rowCreationStatus.delete(newRow.identifier);
      this.meta.rowCreationStatus.set(newRow.identifier, { state: 'success' });
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
      this.meta.rowCreationStatus.set(row.identifier, {
        state: 'failure',
        errors: [RpcError.fromAnything(err)],
      });
    } finally {
      if (this.createPromises.get(row.identifier) === promise) {
        this.createPromises.delete(row.identifier);
      }
    }
    return row;
  }

  async createOrUpdateRecord(
    row: RecordRow,
    column: RawColumnWithMetadata,
  ): Promise<PersistedRecordRow | DraftRecordRow> {
    const rowToCreateOrUpdate = isPlaceholderRecordRow(row)
      ? DraftRecordRow.fromPlaceholder(row)
      : row;

    // Row may not have been updated yet in view when additional request is made.
    // So check current values to ensure another row has not been created.
    const existingNewRecordRow = get(this.newRecords).find(
      (entry) => entry.identifier === rowToCreateOrUpdate.identifier,
    );

    if (!existingNewRecordRow) {
      this.newRecords.update((existing) => [...existing, rowToCreateOrUpdate]);
    }

    let result: PersistedRecordRow | DraftRecordRow;
    if (isPersistedRecordRow(rowToCreateOrUpdate)) {
      result = await this.updateCell(rowToCreateOrUpdate, column);
    } else {
      result = await this.createRecord(rowToCreateOrUpdate);
    }

    return result;
  }

  async duplicateRecord(sourceRow: RecordRow): Promise<void> {
    const pkColumn = get(this.columnsDataStore.pkColumn);

    const fields = { ...sourceRow.record };
    if (pkColumn) {
      delete fields[pkColumn.id];
    }

    const newRow = new DraftRecordRow({
      record: {
        ...this.getEmptyApiRecord(),
        ...fields,
      },
    });

    this.newRecords.update((existing) => existing.concat(newRow));
    await this.createRecord(newRow);
  }

  async addEmptyRecord(): Promise<void> {
    const row = new DraftRecordRow({
      record: this.getEmptyApiRecord(),
    });
    this.newRecords.update((existing) => existing.concat(row));
    await this.createRecord(row);
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;

    this.requestParamsUnsubscriber();
  }
}
