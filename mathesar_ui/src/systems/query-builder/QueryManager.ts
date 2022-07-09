import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CancellablePromise } from '@mathesar-component-library';
import { postAPI, putAPI } from '@mathesar/utils/api';
import type QueryModel from './QueryModel';
import QueryUndoRedoManager from './QueryUndoRedoManager';

export default class QueryManager {
  query: Writable<QueryModel>;

  undoRedoManager: QueryUndoRedoManager;

  // cache: Writable<{}>;

  // state: Writable<{
  //   resultState: string;
  //   isUndoPossible: boolean;
  //   isRedoPossible: boolean;
  // }>;

  // columns: Writable<[]>;

  // results: Writable<[]>;

  querySavePromise: CancellablePromise<QueryModel> | undefined;

  constructor(query: QueryModel) {
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(get(this.query));
  }

  async save(): Promise<QueryModel> {
    const q = get(this.query);
    if (q.isSaveable()) {
      this.querySavePromise?.cancel();
      if (q.id) {
        this.querySavePromise = putAPI(`/api/db/v0/queries/${q.id}/`, q);
      } else {
        this.querySavePromise = postAPI('/api/db/v0/queries/', q);
      }
      const result = await this.querySavePromise;
      this.query.update((q) => q.setId(result.id));
      return result;
    }
    return q;
  }

  // fetchResults(): void {

  // }

  async update(
    callback: (queryModel: QueryModel) => QueryModel,
    opts?: { reversible: boolean },
  ): Promise<void> {
    this.query.update((q) => callback(q));
    this.undoRedoManager.pushState(get(this.query));
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
  }

  async redo(): Promise<void> {
    const query = this.undoRedoManager.redo();
    if (query) {
      this.query.set(query);
      await this.save();
    }
  }

  // getQueryId() {}

  // static getById() {

  // }
}
