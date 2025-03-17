import {
  type Readable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Writable,
  derived,
  get as getStoreValue,
  writable,
} from 'svelte/store';

import { States } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { Column } from '@mathesar/api/rpc/columns';
import type {
  Constraint,
  ConstraintRecipe,
} from '@mathesar/api/rpc/constraints';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import type { ShareConsumer } from '@mathesar/utils/shares';
import type { CancellablePromise } from '@mathesar-component-library';

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

export class ConstraintsDataStore implements Writable<ConstraintsData> {
  private apiContext: {
    database_id: number;
    table_oid: Table['oid'];
  };

  private store: Writable<ConstraintsData>;

  private promise: CancellablePromise<Constraint[]> | undefined;

  readonly shareConsumer?: ShareConsumer;

  /**
   * A set of column ids representing columns which have single-column unique
   * constraints.
   *
   * - Primary key constraints will not be reflected here.
   * - Multi-column unique constraints will not be reflected here.
   */
  uniqueColumns: Readable<Set<number>>;

  constructor({
    database,
    table,
  }: {
    database: Pick<Database, 'id'>;
    table: Pick<Table, 'oid'>;
  }) {
    this.apiContext = { database_id: database.id, table_oid: table.oid };
    this.store = writable({
      state: States.Loading,
      constraints: [],
    });
    this.uniqueColumns = uniqueColumns(this.store);
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
      this.promise = api.constraints.list(this.apiContext).run();
      const constraints = await this.promise;
      const storeData: ConstraintsData = { state: States.Done, constraints };
      this.set(storeData);
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

  async add(recipe: ConstraintRecipe): Promise<void> {
    await api.constraints
      .add({ ...this.apiContext, constraint_def_list: [recipe] })
      .run();
    await this.fetch();
  }

  async remove(constraintId: number): Promise<void> {
    await api.constraints
      .delete({ ...this.apiContext, constraint_oid: constraintId })
      .run();
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
      await this.add({ type: 'u', columns: [column.id] });
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
      uniqueConstraintsForColumn.map((c) =>
        api.constraints
          .delete({ ...this.apiContext, constraint_oid: c.oid })
          .run(),
      ),
    );
    await this.fetch();
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;
  }
}
