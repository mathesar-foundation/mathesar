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

export interface ConstraintData {
  state: States,
  error?: string,
  data: Constraint[],
}

export class Constraints implements Writable<ConstraintData> {
  _parentId: DBObjectEntry['id'];

  _store: Writable<ConstraintData>;

  _promise: CancellablePromise<PaginatedResponse<Constraint>> | null;

  _fetchCallback: (storeData: ConstraintData) => void;

  constructor(
    parentId: number,
    fetchCallback?: (storeData: ConstraintData) => void,
  ) {
    this._parentId = parentId;
    this._store = writable({
      state: States.Loading,
      data: [],
    });
    this._fetchCallback = fetchCallback;
    void this.fetch();
  }

  set(value: ConstraintData): void {
    this._store.set(value);
  }

  update(updater: Updater<ConstraintData>): void {
    this._store.update(updater);
  }

  subscribe(
    run: Subscriber<ConstraintData>,
  ): Unsubscriber {
    return this._store.subscribe(run);
  }

  get(): ConstraintData {
    return getStoreValue(this._store);
  }

  async fetch(): Promise<ConstraintData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this._promise?.cancel();
      const url = `/tables/${this._parentId}/constraints/?limit=500`;
      this._promise = getAPI<PaginatedResponse<Constraint>>(url);

      const response = await this._promise;

      const storeData: ConstraintData = {
        state: States.Done,
        data: response.results,
      };
      this.set(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
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
