import { writable, get as getStoreValue } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry } from '@mathesar/App.d';

export interface Constraint {
  id: number,
  name: string,
  type: string,
  columns: string[],
}

export interface ConstraintsData {
  state: States,
  error?: string,
  constraints: Constraint[],
}

export class ConstraintsDataStore implements Writable<ConstraintsData> {
  _parentId: DBObjectEntry['id'];

  _store: Writable<ConstraintsData>;

  _promise: CancellablePromise<PaginatedResponse<Constraint>> | null;

  _fetchCallback: (storeData: ConstraintsData) => void;

  constructor(
    parentId: number,
    fetchCallback?: (storeData: ConstraintsData) => void,
  ) {
    this._parentId = parentId;
    this._store = writable({
      state: States.Loading,
      constraints: [],
    });
    this._fetchCallback = fetchCallback;
    void this.fetch();
  }

  set(value: ConstraintsData): void {
    this._store.set(value);
  }

  update(updater: Updater<ConstraintsData>): void {
    this._store.update(updater);
  }

  subscribe(
    run: Subscriber<ConstraintsData>,
  ): Unsubscriber {
    return this._store.subscribe(run);
  }

  get(): ConstraintsData {
    return getStoreValue(this._store);
  }

  async fetch(): Promise<ConstraintsData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this._promise?.cancel();
      const url = `/tables/${this._parentId}/constraints/?limit=500`;
      this._promise = getAPI<PaginatedResponse<Constraint>>(url);

      const response = await this._promise;

      const storeData: ConstraintsData = {
        state: States.Done,
        constraints: response.results,
      };
      this.set(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        constraints: [],
      });
    } finally {
      this._promise = null;
    }
    return null;
  }

  destroy(): void {
    this._promise?.cancel();
    this._promise = null;
  }
}
