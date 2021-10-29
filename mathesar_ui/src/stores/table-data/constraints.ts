import { writable, get as getStoreValue, derived } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
  Readable,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry } from '@mathesar/App.d';
import type { Column } from './columns';

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
  private parentId: DBObjectEntry['id'];

  private store: Writable<ConstraintsData>;

  private promise: CancellablePromise<PaginatedResponse<Constraint>> | null;

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
      const url = `/tables/${this.parentId}/constraints/?limit=500`;
      this.promise = getAPI<PaginatedResponse<Constraint>>(url);

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

  /**
   * A constraint only matches if the set of its columns strictly equals the set
   * of columns supplied here. For example, if a constraint is set on three
   * columns, two of which are passed to this function, that constraint will
   * _not_ be returned.
   */
  constraintsThatMatchSetOfColumns(columns: Column[]): Readable<Constraint[]> {
    const columnsNames = columns.map((c) => c.name);
    function isMatch(constraint: Constraint) {
      if (constraint.columns.length !== columnsNames.length) {
        return false;
      }
      return constraint.columns.every(
        (constraintColumn) => columnsNames.includes(constraintColumn),
      );
    }
    return derived(this.store, (s) => s.constraints.filter(isMatch));
  }

  columnHasUniqueConstraint(column: Column): Readable<boolean> {
    const constraints = this.constraintsThatMatchSetOfColumns([column]);
    return derived(constraints, (c) => c.some((constraint) => constraint.type === 'unique'));
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
  }
}
