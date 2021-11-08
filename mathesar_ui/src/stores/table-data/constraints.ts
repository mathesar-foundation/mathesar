import { writable, get as getStoreValue } from 'svelte/store';
import {
  deleteAPI,
  getAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar-component-library';
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

function api(url: string) {
  return {
    get() {
      return getAPI<PaginatedResponse<Constraint>>(`${url}?limit=500`);
    },
    add(constraintDetails: Partial<Constraint>) {
      return postAPI<Partial<Constraint>>(url, constraintDetails);
    },
    remove(constraintId: Constraint['id']) {
      return deleteAPI(`${url}${constraintId}`);
    },
  };
}

export class ConstraintsDataStore implements Writable<ConstraintsData> {
  private parentId: DBObjectEntry['id'];

  private store: Writable<ConstraintsData>;

  private promise: CancellablePromise<PaginatedResponse<Constraint>> | null;

  private api: ReturnType<typeof api>;

  private fetchCallback: (storeData: ConstraintsData) => void;

  constructor(
    parentId: number,
    fetchCallback?: (storeData: ConstraintsData) => void,
  ) {
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      constraints: [],
    });
    this.fetchCallback = fetchCallback;
    this.api = api(`/tables/${this.parentId}/constraints/`);
    void this.fetch();
  }

  set(value: ConstraintsData): void {
    this.store.set(value);
  }

  update(updater: Updater<ConstraintsData>): void {
    this.store.update(updater);
  }

  subscribe(
    run: Subscriber<ConstraintsData>,
  ): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): ConstraintsData {
    return getStoreValue(this.store);
  }

  async fetch(): Promise<ConstraintsData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this.promise?.cancel();
      this.promise = this.api.get();

      const response = await this.promise;

      const storeData: ConstraintsData = {
        state: States.Done,
        constraints: response.results,
      };
      this.set(storeData);
      this.fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        constraints: [],
      });
    } finally {
      this.promise = null;
    }
    return null;
  }

  async remove(constraintId: number): Promise<void> {
    await this.api.remove(constraintId);
    await this.fetch();
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
  }
}
