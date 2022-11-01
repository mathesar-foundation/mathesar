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
  QueryResultRecord,
  QueryRunResponse,
  QueryResultColumn,
} from '@mathesar/api/queries';
import { runQuery } from '@mathesar/stores/queries';
import { SheetSelection } from '@mathesar/components/sheet';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type QueryModel from './QueryModel';
import { processColumnMetaData, getProcessedOutputColumns } from './utils';
import type {
  ProcessedQueryOutputColumn,
  ProcessedQueryResultColumnMap,
  ProcessedQueryOutputColumnMap,
} from './utils';

// TODO: Find a better way to implement type safety here
type QueryRunEvent = { run: QueryRunResponse };
type Events = Record<string, unknown> & Partial<QueryRunEvent>;

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

export default class QueryRunner<
  T extends Events = Events,
> extends EventHandler<T & QueryRunEvent> {
  query: Writable<QueryModel>;

  abstractTypeMap: AbstractTypesMap;

  runState: Writable<RequestStatus | undefined> = writable();

  pagination: Writable<Pagination> = writable(new Pagination({ size: 100 }));

  rowsData: Writable<QueryRowsData> = writable({ totalCount: 0, rows: [] });

  columnsMetaData: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  processedColumns: Writable<ProcessedQueryOutputColumnMap> = writable(
    new ImmutableMap(),
  );

  selection: QuerySheetSelection;

  // Display stores

  selectedColumnAlias: Writable<QueryResultColumn['alias'] | undefined> =
    writable(undefined);

  private runPromise: CancellablePromise<QueryRunResponse> | undefined;

  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super();
    this.abstractTypeMap = abstractTypeMap;
    this.query = writable(query);
    void this.run();
    this.selection = new SheetSelection({
      getColumns: () => [...get(this.processedColumns).values()],
      getRows: () => get(this.rowsData).rows,
      getMaxSelectionRowIndex: () => {
        const rowLength = get(this.rowsData).rows.length;
        const totalCount = get(this.rowsData).totalCount ?? 0;
        const pagination = get(this.pagination);
        const { offset } = pagination;
        const pageSize = pagination.size;
        /**
         * We are not subtracting 1 from the below maxRowIndex calculation
         * inorder to account for the add-new-record placeholder row
         */
        return Math.min(pageSize, totalCount - offset, rowLength);
      },
    });
  }

  async run(): Promise<QueryRunResponse | undefined> {
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
      this.rowsData.set({
        totalCount: response.records.count,
        rows: (response.records.results ?? []).map((entry, index) => ({
          record: entry,
          rowIndex: index,
        })),
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
    this.selectedColumnAlias.set(undefined);
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

  selectColumn(alias: QueryResultColumn['alias']): void {
    const processedColumn = get(this.processedColumns).get(alias);
    if (processedColumn) {
      this.selection.toggleColumnSelection(processedColumn);
    } else {
      this.selection.resetSelection();
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
    this.selection.destroy();
    this.runPromise?.cancel();
  }
}
