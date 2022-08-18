import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { EventHandler, ImmutableMap } from '@mathesar-component-library';
import type { CancellablePromise } from '@mathesar-component-library/types';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import type {
  QueryInstance,
  QueryResultColumn,
  QueryResultColumns,
  QueryResultRecords,
} from '@mathesar/api/queries/queryList';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import Pagination from '@mathesar/utils/Pagination';
import { toast } from '@mathesar/stores/toast';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import type QueryModel from './QueryModel';
import type { QueryModelUpdateDiff } from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';
import { processColumn } from './utils';
import type { ProcessedQueryResultColumnMap } from './utils';

function calcProcessedColumnsBasedOnInitialColumns(
  initialColumns: QueryModel['initial_columns'],
  existingProcessedColumns: ProcessedQueryResultColumnMap,
  abstractTypeMap: AbstractTypesMap,
): ProcessedQueryResultColumnMap {
  let isChangeRequired =
    initialColumns.length !== existingProcessedColumns.size;
  const newProcessedColumns: ProcessedQueryResultColumnMap = new ImmutableMap(
    initialColumns.map((column) => {
      const existingProcessedColumn = existingProcessedColumns.get(
        column.alias,
      );
      if (existingProcessedColumn) {
        if (
          existingProcessedColumn.column.display_name !== column.display_name
        ) {
          isChangeRequired = true;
          return [
            column.alias,
            {
              ...existingProcessedColumn,
              column: {
                ...existingProcessedColumn.column,
                display_name: column.display_name,
              },
            },
          ];
        }

        return [column.alias, existingProcessedColumn];
      }

      isChangeRequired = true;
      return [
        column.alias,
        processColumn(
          {
            alias: column.alias,
            display_name: column.display_name,
            type: 'unknown',
            type_options: null,
            display_options: null,
          },
          abstractTypeMap,
        ),
      ];
    }),
  );

  return isChangeRequired ? newProcessedColumns : existingProcessedColumns;
}

export default class QueryManager extends EventHandler<{
  save: QueryInstance;
}> {
  query: Writable<QueryModel>;

  undoRedoManager: QueryUndoRedoManager;

  // cache: Writable<{}>;

  state: Writable<{
    saveState?: RequestStatus;
    columnsFetchState?: RequestStatus;
    recordsFetchState?: RequestStatus;
    isUndoPossible: boolean;
    isRedoPossible: boolean;
    lastFetchType: 'columns' | 'records' | 'both';
  }> = writable({
    isUndoPossible: false,
    isRedoPossible: false,
    lastFetchType: 'both',
  });

  pagination: Writable<Pagination> = writable(new Pagination({ size: 100 }));

  processedQueryColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  records: Writable<QueryResultRecords> = writable({ count: 0, results: [] });

  abstractTypeMap: AbstractTypesMap;

  // Display stores

  selectedColumnAlias: Writable<QueryResultColumn['alias'] | undefined> =
    writable(undefined);

  // Promises

  querySavePromise: CancellablePromise<QueryInstance> | undefined;

  queryColumnsFetchPromise: CancellablePromise<QueryResultColumns> | undefined;

  queryRecordsFetchPromise: CancellablePromise<QueryResultRecords> | undefined;

  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super();
    this.abstractTypeMap = abstractTypeMap;
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(
      query.isSaveable() ? query : undefined,
    );
    void this.fetchColumnsAndRecords();
  }

  async fetchColumnsAndRecords(): Promise<
    [QueryResultColumns | undefined, QueryResultRecords | undefined]
  > {
    this.state.update((state) => ({
      ...state,
      lastFetchType: 'both',
    }));
    return Promise.all([this.fetchColumns(), this.fetchResults()]);
  }

  recalculateProcessedColumnsUsingInitialColumns(): void {
    const initialColumns = get(this.query).initial_columns;
    /**
     * We are not creating a derived store so that we calculate
     * processed columns only in required scenarios and not everytime
     * query store changes.
     * TODO: Include summarization transform to identify virtual columns
     */
    this.processedQueryColumns.update((existing) =>
      calcProcessedColumnsBasedOnInitialColumns(
        initialColumns,
        existing,
        this.abstractTypeMap,
      ),
    );
  }

  resetProcessedColumns(): void {
    this.processedQueryColumns.set(new ImmutableMap());
  }

  setProcessedColumnsFromResults(resultColumns: QueryResultColumn[]): void {
    const newColumns = new ImmutableMap(
      resultColumns.map((column) => [
        column.alias,
        processColumn(column, this.abstractTypeMap),
      ]),
    );
    this.processedQueryColumns.set(newColumns);
  }

  async save(): Promise<QueryInstance | undefined> {
    const q = this.getQueryModel();
    if (q.isSaveable()) {
      try {
        this.state.update((_state) => ({
          ..._state,
          saveState: { state: 'processing' },
        }));
        this.querySavePromise?.cancel();
        const queryJSON = q.toJSON();
        if (typeof queryJSON.id !== 'undefined') {
          // TODO: Figure out a better way to help TS identify this as a saved instance
          this.querySavePromise = putQuery(queryJSON as QueryInstance);
        } else {
          this.querySavePromise = createQuery(queryJSON);
        }
        const result = await this.querySavePromise;
        this.query.update((qr) => qr.withId(result.id).model);
        this.state.update((_state) => ({
          ..._state,
          saveState: { state: 'success' },
        }));
        await this.dispatch('save', result);
        return result;
      } catch (err) {
        const errors =
          err instanceof Error
            ? [err.message]
            : ['An error occurred while trying to save the query'];
        this.state.update((_state) => ({
          ..._state,
          saveState: {
            state: 'failure',
            errors,
          },
        }));
        toast.error(`Unable to save query: ${errors.join(',')}`);
      }
    }
    return undefined;
  }

  setUndoRedoStates(): void {
    this.state.update((_state) => ({
      ..._state,
      isUndoPossible: this.undoRedoManager.isUndoPossible(),
      isRedoPossible: this.undoRedoManager.isRedoPossible(),
    }));
  }

  async fetchColumns(): Promise<QueryResultColumns | undefined> {
    const q = this.getQueryModel();

    if (typeof q.id === 'undefined') {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'success' },
      }));
      this.resetProcessedColumns();
      return undefined;
    }

    try {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'processing' },
      }));
      this.queryColumnsFetchPromise?.cancel();
      this.queryColumnsFetchPromise = getAPI(
        `/api/db/v0/queries/${q.id}/columns/`,
      );
      const result = await this.queryColumnsFetchPromise;
      this.setProcessedColumnsFromResults(result);
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'success' },
      }));
      return result;
    } catch (err) {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: {
          state: 'failure',
          errors:
            err instanceof Error
              ? [err.message]
              : ['An error occurred while trying to fetch query columns'],
        },
      }));
    }
    return undefined;
  }

  async fetchResults(): Promise<QueryResultRecords | undefined> {
    const q = this.getQueryModel();

    if (typeof q.id === 'undefined') {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'success' },
      }));
      this.records.set({ count: 0, results: [] });
      return undefined;
    }

    try {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'processing' },
      }));
      this.queryRecordsFetchPromise?.cancel();
      const { limit, offset } = get(this.pagination).recordsRequestParams();
      this.queryRecordsFetchPromise = getAPI(
        `/api/db/v0/queries/${q.id}/records/?limit=${limit}&offset=${offset}`,
      );
      const result = await this.queryRecordsFetchPromise;
      this.records.set({
        count: result.count,
        results: result.results ?? [],
      });
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: { state: 'success' },
      }));
      return result;
    } catch (err) {
      this.state.update((_state) => ({
        ..._state,
        recordsFetchState: {
          state: 'failure',
          errors:
            err instanceof Error
              ? [err.message]
              : ['An error occurred while trying to fetch query records'],
        },
      }));
    }
    return undefined;
  }

  async setPagination(
    pagination: Pagination,
  ): Promise<QueryResultRecords | undefined> {
    this.pagination.set(pagination);
    this.state.update((state) => ({
      ...state,
      lastFetchType: 'records',
    }));
    const result = await this.fetchResults();
    return result;
  }

  resetPaginationPane(): void {
    this.pagination.update(
      (pagination) =>
        new Pagination({
          ...pagination,
          page: 1,
        }),
    );
  }

  resetResults(): void {
    this.queryColumnsFetchPromise?.cancel();
    this.queryRecordsFetchPromise?.cancel();
    this.records.set({ count: 0, results: [] });
    this.resetProcessedColumns();
    this.selectedColumnAlias.set(undefined);
    this.state.update((state) => ({
      ...state,
      columnsFetchState: undefined,
      recordsFetchState: undefined,
    }));
    this.resetPaginationPane();
  }

  async update(
    callback: (queryModel: QueryModel) => QueryModelUpdateDiff,
  ): Promise<void> {
    const updateDiff = callback(this.getQueryModel());
    this.query.set(updateDiff.model);
    if (updateDiff.model.isSaveable()) {
      // Push entire model instead of diff to always
      // reload entire state during undo-redo operations
      this.undoRedoManager.pushState(updateDiff.model);
    }
    this.setUndoRedoStates();
    await this.save();
    switch (updateDiff.type) {
      case 'id':
      case 'name':
        break;
      case 'baseTable':
        this.resetResults();
        break;
      case 'initialColumnName':
        this.recalculateProcessedColumnsUsingInitialColumns();
        break;
      case 'initialColumnsArray':
        if (!updateDiff.diff.initial_columns?.length) {
          // All columns have been deleted
          this.resetResults();
        } else {
          this.recalculateProcessedColumnsUsingInitialColumns();
          await this.fetchColumnsAndRecords();
        }
        break;
      case 'transformations':
        this.resetPaginationPane();
        await this.fetchColumnsAndRecords();
        break;
      default:
        await this.fetchColumnsAndRecords();
    }
  }

  async performUndoRedoSync(query?: QueryModel): Promise<void> {
    if (query) {
      const currentQueryModelData = this.getQueryModel();
      let queryToSet = query;
      if (currentQueryModelData?.id) {
        queryToSet = query.withId(currentQueryModelData.id).model;
      }
      this.query.set(queryToSet);
      this.recalculateProcessedColumnsUsingInitialColumns();
      await this.save();
      await this.fetchColumnsAndRecords();
    }
    this.setUndoRedoStates();
  }

  async undo(): Promise<void> {
    const query = this.undoRedoManager.undo();
    await this.performUndoRedoSync(query);
  }

  async redo(): Promise<void> {
    const query = this.undoRedoManager.redo();
    await this.performUndoRedoSync(query);
  }

  getQueryModel(): QueryModel {
    return get(this.query);
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

  destroy(): void {
    super.destroy();
    this.queryColumnsFetchPromise?.cancel();
    this.queryColumnsFetchPromise?.cancel();
    this.queryRecordsFetchPromise?.cancel();
  }
}
