import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library';
import { postAPI, putAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import type QueryModel from './QueryModel';
import type { QueryModelRawData } from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';

interface SavedQueryModelRawData extends QueryModelRawData {
  id: number;
}

export default class QueryManager {
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

  querySavePromise: CancellablePromise<SavedQueryModelRawData> | undefined;

  constructor(query: QueryModel) {
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(get(this.query));
  }

  async save(): Promise<SavedQueryModelRawData | undefined> {
    const q = get(this.query);
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
        this.query.update((qr) => qr.setId(result.id));
        this.state.update((_state) => ({
          ..._state,
          saveState: { state: 'success' },
        }));
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

  async update(
    callback: (queryModel: QueryModel) => QueryModel,
    opts?: { reversible: boolean },
  ): Promise<void> {
    this.query.update((q) => callback(q));
    this.undoRedoManager.pushState(get(this.query));
    this.setUndoRedoStates();
    await this.save();
    // this.fetchResults();
  }

  // async delete() {

  // }

  async undo(): Promise<void> {
    const query = this.undoRedoManager.undo();
    if (query) {
      this.query.set(query);
      await this.save();
    }
    this.setUndoRedoStates();
  }

  async redo(): Promise<void> {
    const query = this.undoRedoManager.redo();
    if (query) {
      this.query.set(query);
      await this.save();
    }
    this.setUndoRedoStates();
  }

  // getQueryId() {}

  // static getById() {

  // }
}
