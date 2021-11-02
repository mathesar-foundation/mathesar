import { writable, get as getStoreValue, derived } from 'svelte/store';
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
  Readable,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry } from '@mathesar/App.d';
import type { Column } from './columns';

export type ConstraintType = 'foreignkey' | 'primary' | 'unique' | 'check' | 'exclude';

export interface Constraint {
  id: number,
  name: string,
  type: ConstraintType,
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

  async add(constraintDetails: Partial<Constraint>): Promise<Partial<Constraint>> {
    const constraint = await this.api.add(constraintDetails);
    await this.fetch();
    return constraint;
  }

  async remove(constraintId: number): Promise<void> {
    await this.api.remove(constraintId);
    await this.fetch();
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

  /**
   * Caveat: even though primary key columns must be unique, this function will
   * give `false` for them because they don't usually have unique constraints
   * set too.
   */
  columnHasUniqueConstraint(column: Column): Readable<boolean> {
    const constraints = this.constraintsThatMatchSetOfColumns([column]);
    return derived(constraints, (c) => c.some((constraint) => constraint.type === 'unique'));
  }

  columnAllowsDuplicates(column: Column): Readable<boolean> {
    return derived(
      this.columnHasUniqueConstraint(column),
      (hasUniqueConstraint) => {
        if (column.primary_key) {
          return false;
        }
        return !hasUniqueConstraint;
      },
    );
  }

  async updateUniquenessOfColumn(
    column: Column,
    updater: (isUnique: boolean) => boolean,
  ): Promise<boolean> {
    if (column.primary_key) {
      const currentlyIsUnique = true; // PK columns are always unique
      const shouldBeUnique = updater(currentlyIsUnique);
      if (!shouldBeUnique) {
        throw new Error(`Column ${column.name} must remain unique because it is a primary key.`);
      }
      return true;
    }

    const uniqueConstraintsForColumn = getStoreValue(
      this.constraintsThatMatchSetOfColumns([column]),
    ).filter((c) => c.type === 'unique');
    const currentlyIsUnique = uniqueConstraintsForColumn.length > 0;
    const shouldBeUnique = updater(currentlyIsUnique);
    if (shouldBeUnique === currentlyIsUnique) {
      return currentlyIsUnique;
    }
    if (shouldBeUnique) {
      await this.add({ type: 'unique', columns: [column.name] });
      return true;
    }
    // Technically, one column can have two unique constraints applied on it,
    // with different names. So we need to make sure do delete _all_ of them.
    await Promise.all(uniqueConstraintsForColumn.map(
      (constraint) => this.api.remove(constraint.id),
    ));
    await this.fetch();
    return false;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
  }
}
