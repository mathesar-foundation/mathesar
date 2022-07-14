import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { EventHandler } from '@mathesar-component-library';
import type { CancellablePromise } from '@mathesar-component-library';
import { getAPI } from '@mathesar/utils/api';
import type { RequestStatus } from '@mathesar/utils/api';
import type {
  QueryInstance,
  QueryResultColumns,
  QueryResultRecords,
} from '@mathesar/api/queries/queryList';
import { createQuery, putQuery } from '@mathesar/stores/queries';
import Pagination from '@mathesar/utils/Pagination';
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
    columnsFetchState?: RequestStatus;
    recordsFetchState?: RequestStatus;
    isUndoPossible: boolean;
    isRedoPossible: boolean;
  }> = writable({
    isUndoPossible: false,
    isRedoPossible: false,
  });

  pagination: Writable<Pagination> = writable(new Pagination());

  columns: Writable<QueryResultColumns> = writable([]);

  records: Writable<QueryResultRecords> = writable({ count: 0, results: [] });

  querySavePromise: CancellablePromise<QueryInstance> | undefined;

  queryColumnsFetchPromise: CancellablePromise<QueryResultColumns> | undefined;

  queryRecordsFetchPromise: CancellablePromise<QueryResultRecords> | undefined;

  constructor(query: QueryModel) {
    super();
    this.query = writable(query);
    this.undoRedoManager = new QueryUndoRedoManager(get(this.query));
    void Promise.all([this.fetchColumns(), this.fetchResults()]);
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
          // TODO: Find cause
          // Typescript does not seem to identify q assignable to QueryInstance
          this.querySavePromise = putQuery(q as QueryInstance);
        } else {
          this.querySavePromise = createQuery(q);
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

  async fetchColumns(): Promise<QueryResultColumns | undefined> {
    const q = this.getQueryModelData();

    if (!q.id) {
      this.state.update((_state) => ({
        ..._state,
        columnsFetchState: { state: 'success' },
      }));
      this.columns.set([]);
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
      this.columns.set(result);
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
    const q = this.getQueryModelData();

    if (!q.id) {
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
      this.queryRecordsFetchPromise = getAPI(
        `/api/db/v0/queries/${q.id}/records/`,
      );
      const result = await this.queryRecordsFetchPromise;
      this.records.set(result);
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

  async update(
    callback: (queryModel: QueryModel) => QueryModel,
    opts?: { reversible: boolean },
  ): Promise<void> {
    this.query.update((q) => callback(q));
    this.undoRedoManager.pushState(this.getQueryModelData());
    this.setUndoRedoStates();
    await this.save();
    await Promise.all([this.fetchColumns(), this.fetchResults()]);
  }

  async performUndoRedoSync(query?: QueryModel): Promise<void> {
    if (query) {
      const currentQuery = this.getQueryModelData();
      let queryToSet = query;
      if (currentQuery?.id) {
        queryToSet = query.withId(currentQuery.id);
      }
      this.query.set(queryToSet);
      await this.save();
      await Promise.all([this.fetchColumns(), this.fetchResults()]);
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
