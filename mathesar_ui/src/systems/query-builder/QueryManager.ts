import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import {
  EventHandler,
  ImmutableMap,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { CancellablePromise } from '@mathesar-component-library/types';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import CacheManager from '@mathesar/utils/CacheManager';
import type {
  QueryInstance,
  QueryResultColumn,
  QueryResultColumns,
  QueryResultRecords,
} from '@mathesar/api/queries/queryList';
import type { TableEntry } from '@mathesar/api/tables';
import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import { getTable } from '@mathesar/stores/tables';
import Pagination from '@mathesar/utils/Pagination';
import { toast } from '@mathesar/stores/toast';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { validateFilterEntry } from '@mathesar/components/filter-entry';
import type QueryModel from './QueryModel';
import type { QueryModelUpdateDiff } from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';
import {
  processColumn,
  getTablesThatReferenceBaseTable,
  getBaseTableColumnsWithLinks,
  getColumnInformationMap,
  processInitialColumns,
} from './utils';
import type {
  ProcessedQueryResultColumn,
  ProcessedQueryResultColumnMap,
  InputColumnsStoreSubstance,
} from './utils';
import QueryFilterTransformationModel from './QueryFilterTransformationModel';
import QuerySummarizationTransformationModel from './QuerySummarizationTransformationModel';

function validateQuery(
  queryModel: QueryModel,
  columnMap: ProcessedQueryResultColumnMap,
): boolean {
  const general =
    isDefinedNonNullable(queryModel.base_table) &&
    isDefinedNonNullable(queryModel.name) &&
    queryModel.name.trim() !== '';
  if (!general) {
    return false;
  }
  return queryModel.transformationModels.every((transformation) => {
    if (transformation instanceof QueryFilterTransformationModel) {
      const column = columnMap.get(transformation.columnIdentifier);
      const condition = column?.allowedFiltersMap.get(
        transformation.conditionIdentifier,
      );
      if (condition) {
        return validateFilterEntry(condition, transformation.value);
      }
      return false;
    }
    return true;
  });
}

export default class QueryManager extends EventHandler<{
  save: QueryInstance;
}> {
  query: Writable<QueryModel>;

  undoRedoManager: QueryUndoRedoManager;

  cacheManagers: {
    inputColumns: CacheManager<number, InputColumnsStoreSubstance>;
  } = {
    inputColumns: new CacheManager(5),
  };

  state: Writable<{
    inputColumnsFetchState?: RequestStatus;
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

  records: Writable<QueryResultRecords> = writable({ count: 0, results: [] });

  abstractTypeMap: AbstractTypesMap;

  inputColumns: Writable<InputColumnsStoreSubstance> = writable({
    baseTableColumns: new Map(),
    tablesThatReferenceBaseTable: new Map(),
    columnInformationMap: new Map(),
  });

  // Processed columns

  processedInitialColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  processedVirtualColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  processedResultColumns: Writable<ProcessedQueryResultColumnMap> = writable(
    new ImmutableMap(),
  );

  // Display stores

  selectedColumnAlias: Writable<QueryResultColumn['alias'] | undefined> =
    writable(undefined);

  // Promises

  baseTableFetchPromise: CancellablePromise<TableEntry> | undefined;

  joinableColumnsfetchPromise:
    | CancellablePromise<JoinableTablesResult>
    | undefined;

  querySavePromise: CancellablePromise<QueryInstance> | undefined;

  queryColumnsFetchPromise: CancellablePromise<QueryResultColumns> | undefined;

  queryRecordsFetchPromise: CancellablePromise<QueryResultRecords> | undefined;

  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super();
    this.abstractTypeMap = abstractTypeMap;
    this.query = writable(query);
    this.reprocessColumns('both');
    this.undoRedoManager = new QueryUndoRedoManager();
    const inputColumnTreePromise = this.calculateInputColumnTree();
    void inputColumnTreePromise.then(() => {
      const isQueryValid = validateQuery(
        query,
        get(this.processedInitialColumns).withEntries(
          get(this.processedVirtualColumns),
        ),
      );
      this.undoRedoManager.pushState(query, isQueryValid);
      return query;
    });
    void this.fetchColumnsAndRecords();
  }

  private async calculateInputColumnTree(): Promise<void> {
    const baseTableId = get(this.query).base_table;
    if (!baseTableId) {
      this.inputColumns.set({
        baseTableColumns: new Map(),
        tablesThatReferenceBaseTable: new Map(),
        columnInformationMap: new Map(),
      });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      return;
    }

    const cachedResult = this.cacheManagers.inputColumns.get(baseTableId);
    if (cachedResult) {
      this.inputColumns.set({
        ...cachedResult,
      });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      this.reprocessColumns('both', false);
      return;
    }

    try {
      this.baseTableFetchPromise?.cancel();
      this.joinableColumnsfetchPromise?.cancel();

      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'processing' },
      }));

      // TODO: Refactor our stores to mimic our db
      this.baseTableFetchPromise = getTable(baseTableId);
      this.joinableColumnsfetchPromise = getAPI<JoinableTablesResult>(
        `/api/db/v0/tables/${baseTableId}/joinable_tables/`,
      );
      const [baseTableResult, joinableColumnsResult] = await Promise.all([
        this.baseTableFetchPromise,
        this.joinableColumnsfetchPromise,
      ]);
      const baseTableColumns = getBaseTableColumnsWithLinks(
        joinableColumnsResult,
        baseTableResult,
      );
      const tablesThatReferenceBaseTable = getTablesThatReferenceBaseTable(
        joinableColumnsResult,
        baseTableResult,
      );
      const columnInformationMap = getColumnInformationMap(
        joinableColumnsResult,
        baseTableResult,
      );
      const inputColumns = {
        baseTableColumns,
        tablesThatReferenceBaseTable,
        columnInformationMap,
      };
      this.cacheManagers.inputColumns.set(baseTableId, inputColumns);
      this.inputColumns.set(inputColumns);
      this.reprocessColumns('both', false);
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : 'There was an error fetching joinable links';
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'failure', errors: [error] },
      }));
    }
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

  /**
   * We are not creating a derived store so that we need to control
   * the callback only for essential scenarios and not everytime
   * query store changes.
   */
  private reprocessColumns(
    type: 'both' | 'initial' | 'virtual',
    setResultColumns = true,
  ): void {
    const queryModel = this.getQueryModel();
    const initialColumns = queryModel.initial_columns;
    if (type === 'initial' || type === 'both') {
      const { columnInformationMap } = get(this.inputColumns);
      if (columnInformationMap.size === 0 && initialColumns.length !== 0) {
        return;
      }
      this.processedInitialColumns.update((existing) =>
        processInitialColumns(
          initialColumns,
          existing,
          this.abstractTypeMap,
          columnInformationMap,
        ),
      );
    }

    const summarizationTransforms: QuerySummarizationTransformationModel[] =
      queryModel.transformationModels.filter(
        (transform): transform is QuerySummarizationTransformationModel =>
          transform instanceof QuerySummarizationTransformationModel,
      );
    if (type === 'virtual' || type === 'both') {
      const virtualColumns: Map<
        ProcessedQueryResultColumn['id'],
        ProcessedQueryResultColumn
      > = new Map();
      summarizationTransforms.forEach((transformation) => {
        [...transformation.aggregations.values()].forEach((entry) => {
          virtualColumns.set(
            entry.outputAlias,
            processColumn(
              {
                alias: entry.outputAlias,
                display_name: entry.displayName,
                type:
                  entry.function === 'aggregate_to_array'
                    ? '_array'
                    : 'integer',
                type_options: null,
                display_options: null,
              },
              this.abstractTypeMap,
            ),
          );
        });
      });
      this.processedVirtualColumns.set(new ImmutableMap(virtualColumns));
    }

    if (setResultColumns) {
      const processedInitialColumns = get(this.processedInitialColumns);
      const processedVirtualColumns = get(this.processedVirtualColumns);
      if (summarizationTransforms.length > 0) {
        const lastTransform =
          summarizationTransforms[summarizationTransforms.length - 1];
        const result = new Map();
        lastTransform.getOutputColumnAliases().forEach((alias) => {
          const column =
            processedVirtualColumns.get(alias) ??
            processedInitialColumns.get(alias);
          if (column) {
            result.set('alias', column);
          } else {
            console.error(
              'This should never happen - Output column not found in both virtual and initial column list',
            );
          }
        });
        this.processedResultColumns.set(new ImmutableMap(result));
      } else {
        this.processedResultColumns.set(
          new ImmutableMap(processedInitialColumns),
        );
      }
    }
  }

  private resetProcessedColumns(): void {
    this.processedResultColumns.set(new ImmutableMap());
  }

  private setProcessedColumnsFromResults(
    resultColumns: QueryResultColumn[],
  ): void {
    const newColumns = new ImmutableMap(
      resultColumns.map((column) => [
        column.alias,
        processColumn(column, this.abstractTypeMap),
      ]),
    );
    this.processedResultColumns.set(newColumns);
  }

  private async updateQuery(queryModel: QueryModel): Promise<{
    clientValidationState: RequestStatus;
    query?: QueryInstance;
  }> {
    this.query.set(queryModel);
    this.state.update((_state) => ({
      ..._state,
      saveState: { state: 'processing' },
    }));

    try {
      this.querySavePromise?.cancel();
      if (get(this.state).inputColumnsFetchState?.state !== 'success') {
        await this.calculateInputColumnTree();
      }
      const isQueryValid = validateQuery(
        queryModel,
        get(this.processedInitialColumns).withEntries(
          get(this.processedVirtualColumns),
        ),
      );
      if (!isQueryValid) {
        this.state.update((_state) => ({
          ..._state,
          saveState: {
            state: 'failure',
            errors: ['Query validation failed'],
          },
        }));
        return {
          clientValidationState: {
            state: 'failure',
            errors: ['TODO: Place validation errors here '],
          },
        };
      }

      const queryJSON = queryModel.toJSON();
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
      return {
        clientValidationState: { state: 'success' },
        query: result,
      };
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
    return {
      clientValidationState: { state: 'success' },
      query: undefined,
    };
  }

  private setUndoRedoStates(): void {
    this.state.update((_state) => ({
      ..._state,
      isUndoPossible: this.undoRedoManager.isUndoPossible(),
      isRedoPossible: this.undoRedoManager.isRedoPossible(),
    }));
  }

  private async fetchColumns(): Promise<QueryResultColumns | undefined> {
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

  private async fetchResults(): Promise<QueryResultRecords | undefined> {
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

  private resetPaginationPane(): void {
    this.pagination.update(
      (pagination) =>
        new Pagination({
          ...pagination,
          page: 1,
        }),
    );
  }

  private resetResults(): void {
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
    const { clientValidationState } = await this.updateQuery(updateDiff.model);
    const isValid = clientValidationState.state === 'success';
    this.undoRedoManager.pushState(updateDiff.model, isValid);
    this.setUndoRedoStates();
    if (isValid) {
      switch (updateDiff.type) {
        case 'baseTable':
          this.resetResults();
          await this.calculateInputColumnTree();
          break;
        case 'initialColumnName':
          this.reprocessColumns('initial');
          break;
        case 'initialColumnsArray':
          if (!updateDiff.diff.initial_columns?.length) {
            // All columns have been deleted
            this.resetResults();
          } else {
            this.reprocessColumns('initial');
            await this.fetchColumnsAndRecords();
          }
          break;
        case 'transformations':
          this.resetPaginationPane();
          await this.fetchColumnsAndRecords();
          break;
        default:
          break;
      }
    }
  }

  // Meant to be used directly outside query manager
  async save(): Promise<void> {
    await this.updateQuery(this.getQueryModel());
    this.resetPaginationPane();
    await this.fetchColumnsAndRecords();
  }

  private async performUndoRedoSync(query?: QueryModel): Promise<void> {
    if (query) {
      const currentQueryModelData = this.getQueryModel();
      let queryToSet = query;
      if (currentQueryModelData?.id) {
        queryToSet = query.withId(currentQueryModelData.id).model;
      }
      this.query.set(queryToSet);
      this.reprocessColumns('both');
      await this.updateQuery(queryToSet);
      this.setUndoRedoStates();
      await this.fetchColumnsAndRecords();
    } else {
      this.setUndoRedoStates();
    }
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
