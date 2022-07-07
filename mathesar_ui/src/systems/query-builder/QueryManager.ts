import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { CancellablePromise } from '@mathesar-component-library';
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

  constructor(query: QueryModel) {
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(get(this.query));
  }

  save(): CancellablePromise<void> {
    const q = get(this.query);
    return new CancellablePromise((resolve, reject) => {
      resolve();
    });
  }

  // fetchResults(): void {

  // }

  async update(
    callback: (queryModel: QueryModel) => QueryModel,
    opts: { reversible: boolean },
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
