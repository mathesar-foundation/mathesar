import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { ApiMultiError } from '@mathesar/api/rest/utils/errors';
import { ImmutableMap, CancellablePromise } from '@mathesar-component-library';
import Pagination from '@mathesar/utils/Pagination';
import type {
  QueryResultRecord,
  QueryRunResponse,
  QueryResultsResponse,
  QueryColumnMetaData,
} from '@mathesar/api/rest/types/queries';
import { runQuery, fetchQueryResults } from '@mathesar/stores/queries';
import { SheetSelection } from '@mathesar/components/sheet';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type { ShareConsumer } from '@mathesar/utils/shares';
import type QueryModel from './QueryModel';
import QueryInspector from './QueryInspector';
import {
  processColumnMetaData,
  getProcessedOutputColumns,
  speculateColumnMetaData,
  type ProcessedQueryOutputColumn,
  type ProcessedQueryResultColumnMap,
  type ProcessedQueryOutputColumnMap,
  type InputColumnsStoreSubstance,
} from './utils';

export interface QueryRow {
  record: QueryResultRecord;
  rowIndex: number;
}

export interface QueryRowsData {
  totalCount: number;
  rows: QueryRow[];
}

export type QuerySheetSelection = SheetSelection<
  QueryRow,
  ProcessedQueryOutputColumn
>;

type QueryRunMode = 'queryId' | 'queryObject';

export default class QueryRunner {
  query: Writable<QueryModel>;

  abstractTypeMap: AbstractTypesMap;

  runState: Writable<RequestStatus<string[] | ApiMultiError> | undefined> =
    writable();

  pagination: Writable<Pagination> = writable(new Pagination({ size: 100 }));

  rowsData: Writable<QueryRowsData> = writable({ totalCount: 0, rows: [] });

  columnsMetaData: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  processedColumns: Writable<ProcessedQueryOutputColumnMap> = writable(
    new ImmutableMap(),
  );

  selection: QuerySheetSelection;

  inspector: QueryInspector;

  private runPromise: CancellablePromise<QueryResultsResponse> | undefined;

  private runMode: QueryRunMode;

  private onRunWithObjectCallback?: (results: QueryRunResponse) => unknown;

  private onRunWithIdCallback?: (results: QueryResultsResponse) => unknown;

  private shareConsumer?: ShareConsumer;

  constructor({
    query,
    abstractTypeMap,
    runMode,
    onRunWithObject,
    onRunWithId,
    shareConsumer,
  }: {
    query: QueryModel;
    abstractTypeMap: AbstractTypesMap;
    runMode?: QueryRunMode;
    onRunWithObject?: (instance: QueryRunResponse) => unknown;
    onRunWithId?: (instance: QueryResultsResponse) => unknown;
    shareConsumer?: ShareConsumer;
  }) {
    this.abstractTypeMap = abstractTypeMap;
    this.runMode = runMode ?? 'queryObject';
    this.query = writable(query);
    this.onRunWithObjectCallback = onRunWithObject;
    this.onRunWithIdCallback = onRunWithId;
    this.shareConsumer = shareConsumer;
    this.speculateProcessedColumns();
    void this.run();
    this.selection = new SheetSelection({
      getColumns: () => [...get(this.processedColumns).values()],
      getColumnOrder: () =>
        [...get(this.processedColumns).values()].map((column) => column.id),
      getRows: () => get(this.rowsData).rows,
      getMaxSelectionRowIndex: () => {
        const rowLength = get(this.rowsData).rows.length;
        const totalCount = get(this.rowsData).totalCount ?? 0;
        const pagination = get(this.pagination);
        const { offset } = pagination;
        const pageSize = pagination.size;
        return Math.min(pageSize, totalCount - offset, rowLength) - 1;
      },
    });
    this.inspector = new QueryInspector(this.query);
  }

  /**
   * We are not creating a derived store so that we need to control
   * the callback only for essential scenarios and not everytime
   * query store changes.
   */
  protected speculateProcessedColumns(
    inputColumnInformationMap?: InputColumnsStoreSubstance['inputColumnInformationMap'],
  ) {
    const speculatedMetaData = speculateColumnMetaData({
      currentProcessedColumnsMetaData: get(this.columnsMetaData),
      inputColumnInformationMap:
        inputColumnInformationMap ??
        (new Map() as InputColumnsStoreSubstance['inputColumnInformationMap']),
      queryModel: this.getQueryModel(),
      abstractTypeMap: this.abstractTypeMap,
    });
    this.columnsMetaData.set(speculatedMetaData);
    this.processedColumns.set(
      getProcessedOutputColumns(
        this.getQueryModel().getOutputColumnAliases(),
        speculatedMetaData,
      ),
    );
  }

  async run(): Promise<QueryResultsResponse | undefined> {
    this.runPromise?.cancel();
    const queryModel = this.getQueryModel();

    if (queryModel.base_table === undefined) {
      const rowsData = { totalCount: 0, rows: [] };
      this.columnsMetaData.set(new ImmutableMap());
      this.processedColumns.set(new ImmutableMap());
      this.rowsData.set(rowsData);
      this.runState.set({ state: 'success' });
      return undefined;
    }

    let response: QueryResultsResponse;
    let triggerCallback: () => unknown;
    try {
      const paginationParams = get(this.pagination).recordsRequestParams();
      this.runState.set({ state: 'processing' });
      if (this.runMode === 'queryObject') {
        const internalRunPromise = runQuery({
          ...queryModel.toRunRequestJson(),
          parameters: {
            ...paginationParams,
          },
        });
        this.runPromise = internalRunPromise;
        const internalResponse = await internalRunPromise;
        response = internalResponse;
        triggerCallback = () =>
          this.onRunWithObjectCallback?.(internalResponse);
      } else {
        const queryId = queryModel.id;
        if (!queryId) {
          this.runState.set({
            state: 'failure',
            errors: ['Query does not contain an id'],
          });
          return undefined;
        }
        this.runPromise = fetchQueryResults(queryModel.id, {
          ...paginationParams,
          ...this.shareConsumer?.getQueryParams(),
        });
        response = await this.runPromise;
        triggerCallback = () => this.onRunWithIdCallback?.(response);
      }

      const columnsMetaData = processColumnMetaData(
        response.column_metadata,
        this.abstractTypeMap,
      );
      this.columnsMetaData.set(columnsMetaData);
      this.processedColumns.set(
        new ImmutableMap(
          getProcessedOutputColumns(response.output_columns, columnsMetaData),
        ),
      );
      this.rowsData.set({
        totalCount: response.records.count,
        rows: (response.records.results ?? []).map((entry, index) => ({
          record: entry,
          rowIndex: index,
        })),
      });
      await triggerCallback();
      this.runState.set({ state: 'success' });
      return response;
    } catch (err) {
      if (err instanceof ApiMultiError) {
        this.runState.set({ state: 'failure', errors: err });
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Unable to run query due to an unknown reason';
        this.runState.set({ state: 'failure', errors: [errorMessage] });
      }
    }
    return undefined;
  }

  async setPagination(pagination: Pagination): Promise<void> {
    this.pagination.set(pagination);
    await this.run();
    this.selection.activateFirstCellInSelectedColumn();
  }

  protected resetPagination(): void {
    this.pagination.update(
      (pagination) =>
        new Pagination({
          ...pagination,
          page: 1,
        }),
    );
  }

  protected resetResults(): void {
    this.clearSelection();
    this.runPromise?.cancel();
    this.resetPagination();
    this.rowsData.set({ totalCount: 0, rows: [] });
    this.processedColumns.set(new ImmutableMap());
    this.runState.set(undefined);
  }

  protected async resetPaginationAndRun(): Promise<void> {
    this.resetPagination();
    await this.run();
    this.selection.activateFirstCellInSelectedColumn();
  }

  selectColumn(alias: QueryColumnMetaData['alias']): void {
    const processedColumn = get(this.processedColumns).get(alias);
    if (!processedColumn) {
      this.selection.resetSelection();
      this.selection.selectAndActivateFirstCellIfExists();
      this.inspector.selectCellTab();
      return;
    }

    const isSelected = this.selection.toggleColumnSelection(processedColumn);
    if (isSelected) {
      this.inspector.selectColumnTab();
      return;
    }

    this.selection.activateFirstCellInSelectedColumn();
    this.inspector.selectCellTab();
  }

  clearSelection(): void {
    this.selection.resetSelection();
  }

  getRows(): QueryRow[] {
    return get(this.rowsData).rows;
  }

  getQueryModel(): QueryModel {
    return get(this.query);
  }

  destroy(): void {
    this.selection.destroy();
    this.runPromise?.cancel();
  }
}
