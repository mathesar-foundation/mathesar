import { writable, get as getStoreValue, derived } from 'svelte/store';
import {
  deleteAPI,
  getAPI,
  postAPI,
  States,
} from '@mathesar/api/utils/requestUtils';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
  Readable,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/api/utils/requestUtils';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { Constraint as ApiConstraint } from '@mathesar/api/types/tables/constraints';
import type { Column } from '@mathesar/api/types/tables/columns';

/**
 * When representing a constraint on the front end, we directly use the object
 * schema from the API.
 *
 * In https://github.com/centerofci/mathesar/pull/776#issuecomment-963514261 we
 * had some discussion about converting the `columns` field to a Set instead of
 * an Array, but we chose to keep it as an Array because we didn't need the
 * performance gains from a Set here.
 */
export type Constraint = ApiConstraint;

export interface ConstraintsData {
  state: States;
  error?: string;
  constraints: Constraint[];
}

/**
 * A constraint only matches if the set of its columns strictly equals the set
 * of columns supplied here. For example, if a constraint is set on three
 * columns, two of which are passed to this function, that constraint will
 * _not_ be returned.
 */
function filterConstraintsByColumnSet(
  constraints: Constraint[],
  columnIds: number[],
): Constraint[] {
  function isMatch(constraint: Constraint) {
    if (constraint.columns.length !== columnIds.length) {
      return false;
    }
    return constraint.columns.every((constraintColumnId) =>
      columnIds.includes(constraintColumnId),
    );
  }
  return constraints.filter(isMatch);
}

/** For doc, @see ConstraintsDataStore.uniqueColumns */
function uniqueColumns(
  constraintsDataStore: Writable<ConstraintsData>,
): Readable<Set<number>> {
  return derived(
    constraintsDataStore,
    ({ constraints }) =>
      new Set(
        constraints
          .filter((c) => c.type === 'unique' && c.columns.length === 1)
          .map((c) => c.columns[0]),
      ),
  );
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
      return deleteAPI(`${url}${constraintId}/`);
    },
  };
}

export class ConstraintsDataStore implements Writable<ConstraintsData> {
  private parentId: DBObjectEntry['id'];

  private store: Writable<ConstraintsData>;

  private promise:
    | CancellablePromise<PaginatedResponse<ApiConstraint>>
    | undefined;

  private api: ReturnType<typeof api>;

  private fetchCallback: (storeData: ConstraintsData) => void;

  /**
   * A set of column ids representing columns which have single-column unique
   * constraints.
   *
   * - Primary key constraints will not be reflected here.
   * - Multi-column unique constraints will not be reflected here.
   */
  uniqueColumns: Readable<Set<number>>;

  constructor(
    parentId: number,
    fetchCallback: (storeData: ConstraintsData) => void = () => {},
  ) {
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      constraints: [],
    });
    this.uniqueColumns = uniqueColumns(this.store);
    this.fetchCallback = fetchCallback;
    this.api = api(`/api/db/v0/tables/${this.parentId}/constraints/`);
    void this.fetch();
  }

  set(value: ConstraintsData): void {
    this.store.set(value);
  }

  update(updater: Updater<ConstraintsData>): void {
    this.store.update(updater);
  }

  subscribe(run: Subscriber<ConstraintsData>): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): ConstraintsData {
    return getStoreValue(this.store);
  }

  async fetch(): Promise<ConstraintsData | undefined> {
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
        error: err instanceof Error ? err.message : undefined,
        constraints: [],
      });
    } finally {
      this.promise = undefined;
    }
    return undefined;
  }

  async add(
    constraintDetails: Partial<Constraint>,
  ): Promise<Partial<Constraint>> {
    const constraint = await this.api.add(constraintDetails);
    await this.fetch();
    return constraint;
  }

  async remove(constraintId: number): Promise<void> {
    await this.api.remove(constraintId);
    await this.fetch();
  }

  async setUniquenessOfColumn(
    column: Column,
    shouldBeUnique: boolean,
  ): Promise<void> {
    if (column.primary_key) {
      if (!shouldBeUnique) {
        throw new Error(
          `Column "${column.name}" must remain unique because it is a primary key.`,
        );
      }
      return;
    }

    const currentlyIsUnique = getStoreValue(this.uniqueColumns).has(column.id);
    if (shouldBeUnique === currentlyIsUnique) {
      return;
    }
    if (shouldBeUnique) {
      await this.add({ type: 'unique', columns: [column.id] });
      return;
    }
    // Technically, one column can have two unique constraints applied on it,
    // with different names. So we need to make sure do delete _all_ of them.
    const { constraints } = getStoreValue(this.store);
    const uniqueConstraintsForColumn = filterConstraintsByColumnSet(
      constraints,
      [column.id],
    ).filter((c) => c.type === 'unique');
    await Promise.all(
      uniqueConstraintsForColumn.map((constraint) =>
        this.api.remove(constraint.id),
      ),
    );
    await this.fetch();
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;
  }
}
