import { type Writable, get, writable } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import {
  type ExplorationResult,
  type SavedExploration,
  explorationIsAddable,
  explorationIsSaved,
} from '@mathesar/api/rpc/explorations';
import { currentDatabase } from '@mathesar/stores/databases';
import { addExploration, replaceExploration } from '@mathesar/stores/queries';
import CacheManager from '@mathesar/utils/CacheManager';
import type { CancellablePromise } from '@mathesar-component-library';

import {
  makeColumnAnchor,
  reconcileDisplayOptionsWithServerResponse,
} from './displayOptions';
import {
  type QueryModel,
  type QueryModelUpdateDiff,
  getTransformationModel,
} from './QueryModel';
import { QueryRunner } from './QueryRunner';
import { QuerySummarizationTransformationModel } from './QuerySummarizationTransformationModel';
import {
  type InputColumnsStoreSubstance,
  type QueryTableStructure,
  getInputColumns,
  getQueryTableStructure,
} from './utils';

export default class QueryManager extends QueryRunner {
  private cacheManagers: {
    /** Keys are table OIDs */
    inputColumns: CacheManager<number, InputColumnsStoreSubstance>;
  } = {
    inputColumns: new CacheManager(5),
  };

  state: Writable<{
    inputColumnsFetchState?: RequestStatus;
    saveState?: RequestStatus;
  }> = writable({});

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
    onSave,
  }: {
    query: QueryModel;
    onSave?: (instance: SavedExploration) => unknown;
  }) {
    super({ query });
    this.onSaveCallback = onSave ?? (() => {});
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

  /**
   * There are cases where the server response contains a _different query_ than
   * the one we sent. This can happen if the server knows that the query needs
   * to be adjusted in specific ways in order to remain valid. This function
   * updates the saved query to be consistent with the query details we got back
   * from the server after running a query.
   */
  private reconcileQueryWithServerResponse(serverResponse: ExplorationResult) {
    const { transformations } = serverResponse.query;
    if (!transformations) return;
    const transformationModels = transformations.map(getTransformationModel);

    const thisQueryModel = this.getQueryModel();
    let newQueryModel = thisQueryModel;
    let isChangeNeeded = false;
    thisQueryModel.transformationModels.forEach((thisTransform, index) => {
      const thatTransform = transformationModels[index];
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

  private async reconcileDisplayOptions(serverResponse: ExplorationResult) {
    const reconciliation = reconcileDisplayOptionsWithServerResponse(
      this.getQueryModel().display_options,
      serverResponse,
    );
    if (!reconciliation.hasChanged) return;

    const newDisplayOptions = reconciliation.newValue;
    const shouldAutoSave = !get(this.queryHasUnsavedChanges);
    await this.update((q) =>
      q.withAllDisplayOptionsReplaced(newDisplayOptions),
    );
    if (shouldAutoSave) {
      await this.save();
    }
  }

  protected async afterRun(result: ExplorationResult): Promise<void> {
    this.reconcileQueryWithServerResponse(result);
    await this.reconcileDisplayOptions(result);
  }

  async update(
    callback: (queryModel: QueryModel) => QueryModelUpdateDiff,
  ): Promise<void> {
    this.state.update((_state) => ({
      ..._state,
      saveState: undefined,
    }));
    const { model, type } = callback(this.getQueryModel());
    const { isRunnable } = await this.updateQuery(model);
    if (isRunnable) {
      switch (type) {
        case 'baseTable':
          this.resetResults();
          this.confirmationNeededForMultipleResults.set(true);
          this.queryHasUnsavedChanges.set(false);
          await this.calculateInputColumnTree();
          break;
        case 'initialColumnName':
          this.speculateColumns();
          break;
        case 'initialColumnsArray':
          if (!model.initial_columns?.length) {
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

  /**
   * @throws Error if unable to save
   */
  async save(): Promise<QueryModel> {
    const maybeSavedExploration =
      this.getQueryModel().toMaybeSavedExploration();
    this.state.update((_state) => ({
      ..._state,
      saveState: { state: 'processing' },
    }));
    try {
      this.querySavePromise?.cancel();
      // TODO: Check for latest validation status here
      if (explorationIsSaved(maybeSavedExploration)) {
        this.querySavePromise = replaceExploration(maybeSavedExploration);
      } else if (explorationIsAddable(maybeSavedExploration)) {
        this.querySavePromise = addExploration(maybeSavedExploration);
      } else {
        throw new Error(get(_)('error_saving_query'));
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

  async setColumnDisplayOptions(
    columnIndex: number,
    displayOptions: ColumnMetadata,
  ): Promise<void> {
    const column = [...get(this.processedColumns).values()][columnIndex];
    if (!column) {
      return;
    }

    await this.update((query) =>
      query.withColumnDisplayOptionsEntry({
        column: makeColumnAnchor(column.column, columnIndex),
        displayOptions,
      }),
    );
  }

  getAutoSummarizationTransformModel():
    | QuerySummarizationTransformationModel
    | undefined {
    const { baseTableColumns } = get(this.inputColumns);
    const firstBaseTableInitialColumn =
      this.getQueryModel().initial_columns.find((initialColumn) =>
        baseTableColumns.has(initialColumn.attnum),
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
