import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { EventHandler } from '@mathesar-component-library';
import type { CancellablePromise } from '@mathesar-component-library';
import { postAPI, putAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import type { QueryInstance } from '@mathesar/api/queries/queryList';
import type QueryModel from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';

export default class QueryManager extends EventHandler<{
  save: QueryInstance;
}> {
  query: Writable<QueryModel>;

  undoRedoManager: QueryUndoRedoManager;

  // cache: Writable<{}>;

  state: Writable<{
    saveState?: RequestStatus;
    resultFetchState?: RequestStatus;
    isUndoPossible: boolean;
    isRedoPossible: boolean;
  }> = writable({
    isUndoPossible: false,
    isRedoPossible: false,
  });

  // columns: Writable<[]>;

  // results: Writable<[]>;

  querySavePromise: CancellablePromise<QueryInstance> | undefined;

  constructor(query: QueryModel) {
    super();
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(get(this.query));
  }

  async save(): Promise<QueryInstance | undefined> {
    const q = this.getQueryModelData();
    if (q.isSaveable()) {
      try {
        this.state.update((_state) => ({
          ..._state,
          saveState: { state: 'processing' },
        }));
        this.querySavePromise?.cancel();
        if (q.id) {
          this.querySavePromise = putAPI(`/api/db/v0/queries/${q.id}/`, q);
        } else {
          this.querySavePromise = postAPI('/api/db/v0/queries/', q);
        }
        const result = await this.querySavePromise;
        this.query.update((qr) => qr.withId(result.id));
        this.state.update((_state) => ({
          ..._state,
          saveState: { state: 'success' },
        }));
        await this.dispatch('save', result);
        return result;
      } catch (err) {
        this.state.update((_state) => ({
          ..._state,
          saveState: {
            state: 'failure',
            errors:
              err instanceof Error
                ? [err.message]
                : ['An error occurred while trying to save the query'],
          },
        }));
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

  // fetchResults(): void {

  // }

  async silentUpdate(
    callback: (queryModel: QueryModel) => QueryModel,
  ): Promise<void> {
    this.query.update((q) => callback(q));
    this.undoRedoManager.pushState(this.getQueryModelData());
    this.setUndoRedoStates();
    await this.save();
  }

  async update(
    callback: (queryModel: QueryModel) => QueryModel,
    opts?: { reversible: boolean },
  ): Promise<void> {
    await this.silentUpdate(callback);
    // this.fetchResults();
  }

  // async delete() {

  // }

  async performUndoRedoSync(query?: QueryModel): Promise<void> {
    if (query) {
      const currentQuery = this.getQueryModelData();
      let queryToSet = query;
      if (currentQuery?.id) {
        queryToSet = query.withId(currentQuery.id);
      }
      this.query.set(queryToSet);
      await this.save();
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

  getQueryModelData(): QueryModel {
    return get(this.query);
  }
}
