import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import type {
  ExplorationResult,
  SavedExploration,
} from '@mathesar/api/rpc/explorations';
import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
import { currentDatabase } from '@mathesar/stores/databases';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import CacheManager from '@mathesar/utils/CacheManager';
import type { CancellablePromise } from '@mathesar-component-library';

import type { QueryModelUpdateDiff } from './QueryModel';
import QueryModel from './QueryModel';
import QueryRunner from './QueryRunner';
import QuerySummarizationTransformationModel from './QuerySummarizationTransformationModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';
import type { InputColumnsStoreSubstance, QueryTableStructure } from './utils';
import { getInputColumns, getQueryTableStructure } from './utils';

export default class QueryManager extends QueryRunner {
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
    tablesThatReferenceBaseTable: [],
    inputColumnInformationMap: new Map(),
  });

  /**
   * To be used later when we need to present the user with a checkbox
   * to remember their choice
   */
  confirmationNeededForMultipleResults: Writable<boolean> = writable(true);

  queryHasUnsavedChanges: Writable<boolean> = writable(false);

  // Promises

  private tableStructurePromise:
    | CancellablePromise<QueryTableStructure>
    | undefined;

  private querySavePromise: CancellablePromise<SavedExploration> | undefined;

  private onSaveCallback: (instance: SavedExploration) => unknown;

  constructor({
    query,
    abstractTypeMap,
    onSave,
  }: {
    query: QueryModel;
    abstractTypeMap: AbstractTypesMap;
    onSave?: (instance: SavedExploration) => unknown;
  }) {
    super({
      query,
      abstractTypeMap,
      onRunWithObject: (response: ExplorationResult) => {
        this.checkAndUpdateSummarizationAfterRun(
          new QueryModel({ database_id: query.database_id, ...response.query }),
        );
      },
    });
    this.onSaveCallback = onSave ?? (() => {});
    const undoRedoManager = new QueryUndoRedoManager();
    undoRedoManager.pushState(query, query.isValid);
    this.undoRedoManager = undoRedoManager;
    void this.calculateInputColumnTree();
  }

  private async calculateInputColumnTree(): Promise<void> {
    const baseTableId = get(this.query).base_table_oid;
    if (!baseTableId) {
      this.inputColumns.set({
        baseTableColumns: new Map(),
        tablesThatReferenceBaseTable: [],
        inputColumnInformationMap: new Map(),
      });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      return;
    }

    const cachedResult = this.cacheManagers.inputColumns.get(baseTableId);
    if (cachedResult) {
      this.inputColumns.set({ ...cachedResult });
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
      this.speculateColumns();
      return;
    }

    try {
      const database = get(currentDatabase);
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'processing' },
      }));

      this.tableStructurePromise?.cancel();
      this.tableStructurePromise = getQueryTableStructure({
        database,
        baseTableId,
      });
      const inputColumns = getInputColumns(await this.tableStructurePromise);

      this.cacheManagers.inputColumns.set(baseTableId, inputColumns);
      this.inputColumns.set(inputColumns);
      this.speculateColumns();
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'success' },
      }));
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : get(_)('error_fetching_joinable_links');
      this.state.update((state) => ({
        ...state,
        inputColumnsFetchState: { state: 'failure', errors: [error] },
      }));
    }
  }

  private speculateColumns() {
    super.speculateProcessedColumns(
      get(this.inputColumns).inputColumnInformationMap,
    );
  }

  private async updateQuery(queryModel: QueryModel): Promise<{
    isValid: boolean;
    isRunnable: boolean;
  }> {
    this.query.set(queryModel);
    this.queryHasUnsavedChanges.set(true);
    if (get(this.state).inputColumnsFetchState?.state !== 'success') {
      await this.calculateInputColumnTree();
    }
    return { isValid: queryModel.isValid, isRunnable: queryModel.isRunnable };
  }

  private setUndoRedoStates(): void {
    this.state.update((_state) => ({
      ..._state,
      isUndoPossible: this.undoRedoManager.isUndoPossible(),
      isRedoPossible: this.undoRedoManager.isRedoPossible(),
    }));
  }

  private checkAndUpdateSummarizationAfterRun(queryModel: QueryModel) {
    const thisQueryModel = this.getQueryModel();
    let newQueryModel = thisQueryModel;
    let isChangeNeeded = false;
    thisQueryModel.transformationModels.forEach((thisTransform, index) => {
      const thatTransform = queryModel.transformationModels[index];
      if (
        thisTransform.type === 'summarize' &&
        thatTransform &&
        thatTransform.type === 'summarize'
      ) {
        const thatTransformGroupWhichIsTheSameAsBaseColumn =
          thatTransform.groups.get(thatTransform.columnIdentifier);
        if (thatTransformGroupWhichIsTheSameAsBaseColumn) {
          thatTransform.groups = thatTransform.groups.without(
            thatTransform.columnIdentifier,
          );
          thatTransform.preprocFunctionIdentifier =
            thatTransformGroupWhichIsTheSameAsBaseColumn.preprocFunction;
        }
        if (
          thatTransform.aggregations.size !== thisTransform.aggregations.size ||
          thatTransform.groups.size !== thisTransform.groups.size
        ) {
          isChangeNeeded = true;
          newQueryModel = newQueryModel.updateTransform(
            index,
            thatTransform,
          ).model;
        }
      }
    });
    if (isChangeNeeded) {
      this.query.set(newQueryModel);
    }
  }

  async update(
    callback: (queryModel: QueryModel) => QueryModelUpdateDiff,
  ): Promise<void> {
    this.state.update((_state) => ({
      ..._state,
      saveState: undefined,
    }));
    const updateDiff = callback(this.getQueryModel());
    const { isValid, isRunnable } = await this.updateQuery(updateDiff.model);
    this.undoRedoManager.pushState(updateDiff.model, isValid);
    this.setUndoRedoStates();
    if (isRunnable) {
      switch (updateDiff.type) {
        case 'baseTable':
          this.resetResults();
          this.undoRedoManager.clear();
          this.setUndoRedoStates();
          this.confirmationNeededForMultipleResults.set(true);
          this.queryHasUnsavedChanges.set(false);
          await this.calculateInputColumnTree();
          break;
        case 'initialColumnName':
          this.speculateColumns();
          break;
        case 'initialColumnsArray':
          if (!updateDiff.diff.initial_columns?.length) {
            // All columns have been deleted
            this.resetResults();
          } else {
            this.speculateColumns();
            await this.run();
          }
          break;
        case 'transformations':
        case 'initialColumnsAndTransformations':
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
      this.speculateColumns();
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
    const queryJSON = this.getQueryModel().toJson();
    this.state.update((_state) => ({
      ..._state,
      saveState: { state: 'processing' },
    }));
    try {
      this.querySavePromise?.cancel();
      // TODO: Check for latest validation status here
      if (queryJSON.id !== undefined) {
        // TODO: Figure out a better way to help TS identify this as a saved instance
        this.querySavePromise = putQuery(queryJSON as SavedExploration);
      } else {
        this.querySavePromise = createQuery(queryJSON);
      }
      const result = await this.querySavePromise;
      this.query.update((qr) => qr.withId(result.id).model);
      await this.onSaveCallback(result);
      this.state.update((_state) => ({
        ..._state,
        saveState: { state: 'success' },
      }));
      this.queryHasUnsavedChanges.set(false);
      return this.getQueryModel();
    } catch (err) {
      const errors =
        err instanceof Error ? [err.message] : [get(_)('error_saving_query')];
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

  getAutoSummarizationTransformModel():
    | QuerySummarizationTransformationModel
    | undefined {
    const { baseTableColumns } = get(this.inputColumns);
    const firstBaseTableInitialColumn =
      this.getQueryModel().initial_columns.find((initialColumn) =>
        baseTableColumns.has(initialColumn.id),
      );
    if (firstBaseTableInitialColumn) {
      return new QuerySummarizationTransformationModel({
        type: 'summarize',
        spec: {
          base_grouping_column: firstBaseTableInitialColumn.alias,
        },
      });
    }
    return undefined;
  }

  destroy(): void {
    super.destroy();
    this.tableStructurePromise?.cancel();
    this.querySavePromise?.cancel();
  }
}
