import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { RequestStatus } from '@mathesar/utils/api';
import {
  ImmutableMap,
  CancellablePromise,
  EventHandler,
} from '@mathesar-component-library';
import Pagination from '@mathesar/utils/Pagination';
import type {
  QueryResultRecords,
  QueryRunResponse,
  QueryResultColumn,
} from '@mathesar/api/queries';
import { runQuery } from '@mathesar/stores/queries';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type QueryModel from './QueryModel';
import { processColumnMetaData, getProcessedOutputColumns } from './utils';
import type { ProcessedQueryResultColumnMap } from './utils';

// TODO: Find a better way to implement type safety here
type QueryRunEvent = { run: QueryRunResponse };
type Events = Record<string, unknown> & Partial<QueryRunEvent>;

export default class QueryRunner<
  T extends Events = Events,
> extends EventHandler<T & QueryRunEvent> {
  query: Writable<QueryModel>;

  abstractTypeMap: AbstractTypesMap;

  runState: Writable<RequestStatus | undefined> = writable();

  pagination: Writable<Pagination> = writable(new Pagination({ size: 100 }));

  records: Writable<QueryResultRecords> = writable({ count: 0, results: [] });

  columnsMetaData: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  processedColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  // Display stores

  selectedColumnAlias: Writable<QueryResultColumn['alias'] | undefined> =
    writable(undefined);

  private runPromise: CancellablePromise<QueryRunResponse> | undefined;

  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super();
    this.abstractTypeMap = abstractTypeMap;
    this.query = writable(query);
    void this.run();
  }

  async run(): Promise<QueryRunResponse | undefined> {
    this.runPromise?.cancel();
    const queryModel = this.getQueryModel();

    if (queryModel.base_table === undefined) {
      const records = { count: 0, results: [] };
      this.columnsMetaData.set(new ImmutableMap());
      this.processedColumns.set(new ImmutableMap());
      this.records.set(records);
      this.runState.set({ state: 'success' });
      return undefined;
    }

    try {
      const paginationRequest = get(this.pagination).recordsRequestParams();
      this.runState.set({ state: 'processing' });
      this.runPromise = runQuery({
        base_table: queryModel.base_table,
        initial_columns: queryModel.initial_columns,
        transformations: queryModel.transformationModels.map((transformation) =>
          transformation.toJSON(),
        ),
        parameters: {
          ...paginationRequest,
        },
      });
      const response = await this.runPromise;
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
      this.records.set({
        count: response.records.count,
        results: response.records.results ?? [],
      });
      await this.dispatch('run', response);
      this.runState.set({ state: 'success' });
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to run query due to an unknown reason';
      this.runState.set({ state: 'failure', errors: [errorMessage] });
    }
    return undefined;
  }

  async setPagination(
    pagination: Pagination,
  ): Promise<QueryResultRecords | undefined> {
    this.pagination.set(pagination);
    const result = await this.run();
    return result?.records;
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
    this.selectedColumnAlias.set(undefined);
    this.runPromise?.cancel();
    this.resetPagination();
    this.records.set({ count: 0, results: [] });
    this.processedColumns.set(new ImmutableMap());
    this.runState.set(undefined);
  }

  protected async resetPaginationAndRun(): Promise<
    QueryRunResponse | undefined
  > {
    this.resetPagination();
    return this.run();
  }

  selectColumn(alias: QueryResultColumn['alias']): void {
    if (
      get(this.query).initial_columns.some((column) => column.alias === alias)
    ) {
      this.selectedColumnAlias.set(alias);
    } else {
      this.selectedColumnAlias.set(undefined);
    }
  }

  clearSelectedColumn(): void {
    this.selectedColumnAlias.set(undefined);
  }

  getQueryModel(): QueryModel {
    return get(this.query);
  }

  destroy(): void {
    super.destroy();
    this.runPromise?.cancel();
  }
}
