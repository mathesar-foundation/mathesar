import { type Readable, derived, writable } from 'svelte/store';

import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { api } from '@mathesar/api/rpc';
import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type {
  RawColumnWithMetadata,
  ColumnCreationSpec,
  ColumnPatchSpec,
} from '@mathesar/api/rpc/columns';
import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
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
  columnDeleted: RawColumnWithMetadata['id'];
  columnPatched: void;
}> {
  private apiContext: {
    database_id: number;
    table_oid: Table['oid'];
  };

  private promise: CancellablePromise<RawColumnWithMetadata[]> | undefined;

  private fetchedColumns = writable<RawColumnWithMetadata[]>([]);

  fetchStatus = writable<RequestStatus | undefined>(undefined);

  hiddenColumns: WritableSet<number>;

  /** Will only show visible columns */
  columns: Readable<RawColumnWithMetadata[]>;

  pkColumn: Readable<RawColumnWithMetadata | undefined>;

  readonly shareConsumer?: ShareConsumer;

  constructor({
    database,
    table,
    hiddenColumns,
    shareConsumer,
  }: {
    database: Pick<Database, 'id'>;
    table: Pick<Table, 'oid'>;
    /** Values are column ids */
    hiddenColumns?: Iterable<number>;
    shareConsumer?: ShareConsumer;
  }) {
    super();
    this.apiContext = { database_id: database.id, table_oid: table.oid };
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

  async fetch(): Promise<RawColumnWithMetadata[] | undefined> {
    try {
      this.fetchStatus.set({ state: 'processing' });
      this.promise?.cancel();
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

  async rename(id: RawColumnWithMetadata['id'], name: string): Promise<void> {
    await api.columns
      .patch({ ...this.apiContext, column_data_list: [{ id, name }] })
      .run();
    await this.dispatch('columnRenamed');
  }

  async updateDescription(
    id: RawColumnWithMetadata['id'],
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
    column: RawColumnWithMetadata,
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

  async setDisplayOptions(
    column: Pick<RawColumnWithMetadata, 'id'>,
    displayOptions: ColumnMetadata | null,
  ): Promise<void> {
    await api.columns.metadata
      .set({
        ...this.apiContext,
        column_meta_data_list: [{ attnum: column.id, ...displayOptions }],
      })
      .run();

    this.fetchedColumns.update((columns) =>
      columns.map((c) =>
        c.id === column.id
          ? {
              ...c,
              metadata: { ...c.metadata, ...displayOptions },
            }
          : c,
      ),
    );
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;
    super.destroy();
  }

  async deleteColumn(columnId: RawColumnWithMetadata['id']): Promise<void> {
    await api.columns
      .delete({ ...this.apiContext, column_attnums: [columnId] })
      .run();
    await this.dispatch('columnDeleted', columnId);
    await this.fetch();
  }
}
