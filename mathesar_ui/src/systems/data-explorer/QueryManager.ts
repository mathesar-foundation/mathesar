import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import {
  EventHandler,
  ImmutableMap,
  isDefinedNonNullable,
  CancellablePromise,
} from '@mathesar-component-library';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import CacheManager from '@mathesar/utils/CacheManager';
import type { QueryInstance } from '@mathesar/api/queries';
import type { TableEntry } from '@mathesar/api/tables';
import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import { getTable } from '@mathesar/stores/tables';
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
import QueryRunner from './QueryRunner';

function validateQuery(
  queryModel: QueryModel,
  columnMap: ProcessedQueryResultColumnMap,
): boolean {
  const general = isDefinedNonNullable(queryModel.base_table);
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

export default class QueryManager extends QueryRunner<{ save: QueryInstance }> {
  private undoRedoManager: QueryUndoRedoManager;

  private cacheManagers: {
    inputColumns: CacheManager<number, InputColumnsStoreSubstance>;
  } = {
    inputColumns: new CacheManager(5),
  };

  state: Writable<{
    inputColumnsFetchState?: RequestStatus;
    saveState?: RequestStatus;
    isUndoPossible: boolean;
    isRedoPossible: boolean;
  }> = writable({
    isUndoPossible: false,
    isRedoPossible: false,
  });

  inputColumns: Writable<InputColumnsStoreSubstance> = writable({
    baseTableColumns: new Map(),
    tablesThatReferenceBaseTable: new Map(),
    columnInformationMap: new Map(),
  });

  private eventHandler: EventHandler<{ save: QueryInstance }> =
    new EventHandler();

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

  // Promises

  private baseTableFetchPromise: CancellablePromise<TableEntry> | undefined;

  private joinableColumnsfetchPromise:
    | CancellablePromise<JoinableTablesResult>
    | undefined;

  private querySavePromise: CancellablePromise<QueryInstance> | undefined;

  // NEW CHANGES
  constructor(query: QueryModel, abstractTypeMap: AbstractTypesMap) {
    super(query, abstractTypeMap);
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
        const result = new Map<
          ProcessedQueryResultColumn['id'],
          ProcessedQueryResultColumn
        >();
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

  private async updateQuery(queryModel: QueryModel): Promise<{
    clientValidationState: RequestStatus;
  }> {
    this.query.set(queryModel);
    if (get(this.state).inputColumnsFetchState?.state !== 'success') {
      await this.calculateInputColumnTree();
    }
    const isQueryValid = validateQuery(
      queryModel,
      get(this.processedInitialColumns).withEntries(
        get(this.processedVirtualColumns),
      ),
    );
    const clientValidationState: RequestStatus = isQueryValid
      ? { state: 'success' }
      : {
          state: 'failure',
          errors: ['TODO: Place validation errors here '],
        };
    return { clientValidationState };
  }

  private setUndoRedoStates(): void {
    this.state.update((_state) => ({
      ..._state,
      isUndoPossible: this.undoRedoManager.isUndoPossible(),
      isRedoPossible: this.undoRedoManager.isRedoPossible(),
    }));
  }

  private resetState(): void {
    this.state.update((state) => ({
      ...state,
    }));
    this.resetResults();
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
          this.resetState();
          this.undoRedoManager.clear();
          this.setUndoRedoStates();
          await this.calculateInputColumnTree();
          break;
        case 'initialColumnName':
          this.reprocessColumns('initial');
          break;
        case 'initialColumnsArray':
          if (!updateDiff.diff.initial_columns?.length) {
            // All columns have been deleted
            this.resetState();
          } else {
            this.reprocessColumns('initial');
            await this.run();
          }
          break;
        case 'transformations':
          await this.resetPaginationAndRun();
          break;
        default:
          break;
      }
    }
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
      await this.run();
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

  /**
   * @throws Error if unable to save
   */
  async save(): Promise<QueryModel> {
    const queryJSON = this.getQueryModel().toJSON();
    this.state.update((_state) => ({
      ..._state,
      saveState: { state: 'processing' },
    }));
    try {
      this.querySavePromise?.cancel();
      // TODO: Check for latest validation status here
      if (queryJSON.id !== undefined) {
        // TODO: Figure out a better way to help TS identify this as a saved instance
        this.querySavePromise = putQuery(queryJSON as QueryInstance);
      } else {
        this.querySavePromise = createQuery(queryJSON);
      }
      const result = await this.querySavePromise;
      this.query.update((qr) => qr.withId(result.id).model);
      await this.dispatch('save', result);
      this.state.update((_state) => ({
        ..._state,
        saveState: { state: 'success' },
      }));
      return this.getQueryModel();
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
      throw err;
    }
  }

  destroy(): void {
    super.destroy();
  }
}
