import type { Readable, Writable } from 'svelte/store';
import { derived, get, writable } from 'svelte/store';

import { ApiMultiError } from '@mathesar/api/rest/utils/errors';
import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type {
  QueryColumnMetaData,
  QueryResultRecord,
  QueryRunResponse,
} from '@mathesar/api/rpc/explorations';
import Plane from '@mathesar/components/sheet/selection/Plane';
import Series from '@mathesar/components/sheet/selection/Series';
import SheetSelectionStore from '@mathesar/components/sheet/selection/SheetSelectionStore';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { fetchQueryResults } from '@mathesar/stores/queries';
import Pagination from '@mathesar/utils/Pagination';
import type { ShareConsumer } from '@mathesar/utils/shares';
import { CancellablePromise, ImmutableMap } from '@mathesar-component-library';

import QueryInspector from './QueryInspector';
import type QueryModel from './QueryModel';
import {
  type InputColumnsStoreSubstance,
  type ProcessedQueryOutputColumnMap,
  type ProcessedQueryResultColumnMap,
  getProcessedOutputColumns,
  processColumnMetaData,
  speculateColumnMetaData,
} from './utils';

export interface QueryRow {
  record: QueryResultRecord;
  rowIndex: number;
}

export function getRowSelectionId(row: QueryRow): string {
  return String(row.rowIndex);
}

export interface QueryRowsData {
  totalCount: number;
  rows: QueryRow[];
}

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

  /** Keys are row selection ids */
  selectableRowsMap: Readable<Map<string, QueryRow>>;

  selection: SheetSelectionStore;

  inspector: QueryInspector;

  private runPromise: CancellablePromise<QueryRunResponse> | undefined;

  private runMode: QueryRunMode;

  private onRunWithObjectCallback?: (results: QueryRunResponse) => unknown;

  private onRunWithIdCallback?: (results: QueryRunResponse) => unknown;

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
    onRunWithId?: (instance: QueryRunResponse) => unknown;
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
    this.selectableRowsMap = derived(
      this.rowsData,
      ({ rows }) => new Map(rows.map((r) => [getRowSelectionId(r), r])),
    );

    const plane = derived(
      [this.rowsData, this.processedColumns],
      ([{ rows }, columnsMap]) => {
        const rowIds = new Series(rows.map(getRowSelectionId));
        const columns = [...columnsMap.values()];
        const columnIds = new Series(columns.map((c) => String(c.id)));
        return new Plane(rowIds, columnIds);
      },
    );
    this.selection = new SheetSelectionStore(plane);

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

  async run(): Promise<QueryRunResponse | undefined> {
    this.runPromise?.cancel();
    const queryModel = this.getQueryModel();

    if (queryModel.base_table_oid === undefined) {
      const rowsData = { totalCount: 0, rows: [] };
      this.columnsMetaData.set(new ImmutableMap());
      this.processedColumns.set(new ImmutableMap());
      this.rowsData.set(rowsData);
      this.runState.set({ state: 'success' });
      return undefined;
    }

    let response: QueryRunResponse;
    let triggerCallback: () => unknown;
    try {
      const paginationParams = get(this.pagination).recordsRequestParams();
      this.runState.set({ state: 'processing' });
      if (this.runMode === 'queryObject') {
        const internalRunPromise = api.explorations
          .run({
            exploration_def: queryModel.toExplorationDef(),
            ...paginationParams,
          })
          .run();
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
    this.runPromise?.cancel();
    this.resetPagination();
    this.rowsData.set({ totalCount: 0, rows: [] });
    this.processedColumns.set(new ImmutableMap());
    this.runState.set(undefined);
  }

  protected async resetPaginationAndRun(): Promise<void> {
    this.resetPagination();
    await this.run();
  }

  selectColumn(alias: QueryColumnMetaData['alias']): void {
    const processedColumn = get(this.processedColumns).get(alias);
    if (!processedColumn) {
      return;
    }
    this.selection.update((s) => s.ofOneColumn(processedColumn.id));
    this.inspector.activate('column');
  }

  getQueryModel(): QueryModel {
    return get(this.query);
  }

  destroy(): void {
    this.runPromise?.cancel();
    this.selection.destroy();
  }
}
