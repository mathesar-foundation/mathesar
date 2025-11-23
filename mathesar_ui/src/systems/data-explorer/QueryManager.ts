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
import { databasesStore } from '@mathesar/stores/databases';
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

  // file: mathesar_ui/src/systems/data-explorer/QueryManager.ts (ref: 1c6eefe1c2392e61a1173ba35d88ce4e1cd60ca6)
private reconcileQueryWithServerResponse(serverResponse: ExplorationResult) {
  const { transformations } = serverResponse.query;
  if (!transformations) return;
  const transformationModels = transformations.map(getTransformationModel);

  const thisQueryModel = this.getQueryModel();
  let newQueryModel = thisQueryModel;
  let isChangeNeeded = false;

  // Type guard: detect summarization transform shape
  function isSummarizationTransform(
    t: unknown,
  ): t is QuerySummarizationTransformationModel {
    if (!t || typeof t !== 'object') return false;
    const asAny = t as Record<string, unknown>;
    // prefer a discriminant if present
    if (asAny.type !== undefined && typeof asAny.type === 'string') {
      const typeStr = String(asAny.type).toLowerCase();
      return (
        typeStr === 'summarize' ||
        typeStr === 'summarization' ||
        typeStr === 'summarise'
      );
    }
    // fallback structural checks: expect 'aggregations' and 'groups' to exist
    return (
      asAny.aggregations !== undefined &&
      asAny.groups !== undefined
    );
  }

  thisQueryModel.transformationModels.forEach((thisTransform, index) => {
    const thatTransform = transformationModels[index];
    if (
      isSummarizationTransform(thisTransform) &&
      thatTransform &&
      isSummarizationTransform(thatTransform)
    ) {
      // Narrowed types here:
      const thisSumm = thisTransform as QuerySummarizationTransformationModel;
      const thatSumm = thatTransform as QuerySummarizationTransformationModel;

      // Safely extract groups and other maps (they may be Map-like or plain objects)
      const thatGroups: unknown = thatSumm.groups;
      const columnId = (thatSumm as any).columnIdentifier; // if columnIdentifier not typed, keep narrow use
      let thatTransformGroupWhichIsTheSameAsBaseColumn: unknown;

      if (thatGroups && typeof (thatGroups as any).get === 'function') {
        // Map-like API
        thatTransformGroupWhichIsTheSameAsBaseColumn = (thatGroups as Map<any, any>).get(columnId);
      } else if (thatGroups && Object.prototype.hasOwnProperty.call(thatGroups, columnId)) {
        thatTransformGroupWhichIsTheSameAsBaseColumn = (thatGroups as Record<string, any>)[columnId];
      }

      if (thatTransformGroupWhichIsTheSameAsBaseColumn) {
        // replace groups without mutating original when possible
        if (thatGroups && typeof (thatGroups as any).without === 'function') {
          // e.g., Immutable.js style
          (thatSumm as any).groups = (thatGroups as any).without(columnId);
        } else {
          try {
            // attempt to build a new Map copy without the key
            const gCopy = new Map(Object.entries(Object.fromEntries((thatGroups as any))));
            gCopy.delete(columnId);
            (thatSumm as any).groups = gCopy;
          } catch {
            // fallback: leave as-is
            (thatSumm as any).groups = thatGroups;
          }
        }
        // safe assignment for preprocFunctionIdentifier
        (thatSumm as any).preprocFunctionIdentifier =
          (thatTransformGroupWhichIsTheSameAsBaseColumn as any).preprocFunction;
      }

      // safe size comparisons with optional chaining and defaults
      const thatAggSize = (thatSumm as any).aggregations?.size ?? 0;
      const thisAggSize = (thisSumm as any).aggregations?.size ?? 0;
      const thatGroupsSize = (thatSumm as any).groups?.size ?? 0;
      const thisGroupsSize = (thisSumm as any).groups?.size ?? 0;

      if (thatAggSize !== thisAggSize || thatGroupsSize !== thisGroupsSize) {
        isChangeNeeded = true;
        newQueryModel = newQueryModel.updateTransform(index, thatSumm).model;
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
