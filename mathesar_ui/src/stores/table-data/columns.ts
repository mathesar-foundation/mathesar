import { type Readable, derived, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type {
  Column,
  ColumnCreationSpec,
  ColumnPatchSpec,
} from '@mathesar/api/rpc/columns';
import type { Database } from '@mathesar/api/rpc/databases';
import type { Table } from '@mathesar/api/rpc/tables';
import { getErrorMessage } from '@mathesar/utils/errors';
import type { ShareConsumer } from '@mathesar/utils/shares';
import {
  type CancellablePromise,
  EventHandler,
  WritableSet,
} from '@mathesar-component-library';

export class ColumnsDataStore extends EventHandler<{
  columnRenamed: void;
  columnAdded: void;
  columnDeleted: Column['id'];
  columnPatched: void;
}> {
  private apiContext: {
    database_id: number;
    table_oid: Table['oid'];
  };

  private promise: CancellablePromise<Column[]> | undefined;

  private fetchedColumns = writable<Column[]>([]);

  fetchStatus = writable<RequestStatus | undefined>(undefined);

  hiddenColumns: WritableSet<number>;

  /** Will only show visible columns */
  columns: Readable<Column[]>;

  pkColumn: Readable<Column | undefined>;

  readonly shareConsumer?: ShareConsumer;

  constructor({
    database,
    tableOid,
    hiddenColumns,
    shareConsumer,
  }: {
    database: Pick<Database, 'id'>;
    tableOid: Table['oid'];
    /** Values are column ids */
    hiddenColumns?: Iterable<number>;
    shareConsumer?: ShareConsumer;
  }) {
    super();
    this.apiContext = { database_id: database.id, table_oid: tableOid };
    this.shareConsumer = shareConsumer;
    this.hiddenColumns = new WritableSet(hiddenColumns);
    this.columns = derived(
      [this.fetchedColumns, this.hiddenColumns],
      ([fetched, hidden]) => fetched.filter((column) => !hidden.has(column.id)),
    );
    this.pkColumn = derived(this.fetchedColumns, (fetched) =>
      fetched.find((c) => c.primary_key),
    );
    void this.fetch();
  }

  async fetch(): Promise<Column[] | undefined> {
    try {
      this.fetchStatus.set({ state: 'processing' });
      this.promise?.cancel();
      // TODO_BETA: For some reason `...this.shareConsumer?.getQueryParams()`
      // was getting passed into the API call when it was REST. I don't know
      // why. We need to figure out if this is necessary to replicate for the
      // RPC call.
      this.promise = api.columns
        .list_with_metadata({ ...this.apiContext })
        .run();
      const columns = await this.promise;
      this.fetchedColumns.set(columns);
      this.fetchStatus.set({ state: 'success' });
      return columns;
    } catch (e) {
      this.fetchStatus.set({ state: 'failure', errors: [getErrorMessage(e)] });
      return undefined;
    } finally {
      this.promise = undefined;
    }
  }

  async add(columnDetails: ColumnCreationSpec): Promise<void> {
    await api.columns
      .add({ ...this.apiContext, column_data_list: [columnDetails] })
      .run();
    await this.dispatch('columnAdded');
    await this.fetch();
  }

  async rename(id: Column['id'], name: string): Promise<void> {
    await api.columns
      .patch({ ...this.apiContext, column_data_list: [{ id, name }] })
      .run();
    await this.dispatch('columnRenamed');
  }

  async updateDescription(
    id: Column['id'],
    description: string | null,
  ): Promise<void> {
    await api.columns
      .patch({ ...this.apiContext, column_data_list: [{ id, description }] })
      .run();
    this.fetchedColumns.update((columns) =>
      columns.map((c) => (c.id === id ? { ...c, description } : c)),
    );
  }

  async setNullabilityOfColumn(
    column: Column,
    nullable: boolean,
  ): Promise<void> {
    if (column.primary_key) {
      throw new Error(
        `Column "${column.name}" cannot allow NULL because it is a primary key.`,
      );
    }
    await api.columns
      .patch({
        ...this.apiContext,
        column_data_list: [{ id: column.id, nullable }],
      })
      .run();
    await this.fetch();
  }

  async patch(patchSpec: ColumnPatchSpec): Promise<void> {
    await api.columns
      .patch({
        ...this.apiContext,
        column_data_list: [patchSpec],
      })
      .run();
    await this.fetch();
    await this.dispatch('columnPatched');
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;
    super.destroy();
  }

  async deleteColumn(columnId: Column['id']): Promise<void> {
    await api.columns
      .delete({ ...this.apiContext, column_attnums: [columnId] })
      .run();
    await this.dispatch('columnDeleted', columnId);
    await this.fetch();
  }
}
