import { type Readable, derived, writable } from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import {
  type CancellablePromise,
  EventHandler,
  WritableSet,
} from '@mathesar-component-library';
import type { Column } from '@mathesar/api/tables/columns';
import type { PaginatedResponse, RequestStatus } from '@mathesar/utils/api';
import { deleteAPI, getAPI, patchAPI, postAPI } from '@mathesar/utils/api';
import { getErrorMessage } from '@mathesar/utils/errors';

function api(url: string) {
  return {
    get() {
      return getAPI<PaginatedResponse<Column>>(`${url}?limit=500`);
    },
    add(columnDetails: Partial<Column>) {
      return postAPI<Partial<Column>>(url, columnDetails);
    },
    remove(id: Column['id']) {
      return deleteAPI(`${url}${id}/`);
    },
    update(id: Column['id'], data: Partial<Column>) {
      return patchAPI<Partial<Column>>(`${url}${id}/`, data);
    },
  };
}

export class ColumnsDataStore extends EventHandler<{
  columnRenamed: number;
  columnAdded: Partial<Column>;
  columnDeleted: number;
  columnPatched: Partial<Column>;
  columnsFetched: Column[];
}> {
  private parentId: DBObjectEntry['id'];

  private promise: CancellablePromise<PaginatedResponse<Column>> | undefined;

  private api: ReturnType<typeof api>;

  private fetchedColumns = writable<Column[]>([]);

  fetchStatus = writable<RequestStatus | undefined>(undefined);

  hiddenColumns: WritableSet<number>;

  /** Will only show visible columns */
  columns: Readable<Column[]>;

  pkColumn: Readable<Column | undefined>;

  constructor({
    parentId,
    hiddenColumns,
  }: {
    parentId: number;
    /** Values are column ids */
    hiddenColumns?: Iterable<number>;
  }) {
    super();
    this.parentId = parentId;
    this.api = api(`/api/db/v0/tables/${this.parentId}/columns/`);
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
      this.promise = this.api.get();
      const response = await this.promise;
      const columns = response.results;
      this.fetchedColumns.set(columns);
      this.fetchStatus.set({ state: 'success' });
      await this.dispatch('columnsFetched', columns);
      return columns;
    } catch (e) {
      this.fetchStatus.set({ state: 'failure', errors: [getErrorMessage(e)] });
      return undefined;
    } finally {
      this.promise = undefined;
    }
  }

  async add(columnDetails: Partial<Column>): Promise<Partial<Column>> {
    const column = await this.api.add(columnDetails);
    await this.dispatch('columnAdded', column);
    await this.fetch();
    return column;
  }

  async rename(id: Column['id'], newName: string): Promise<void> {
    await this.api.update(id, { name: newName });
    await this.dispatch('columnRenamed', id);
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
    await this.api.update(column.id, { nullable });
    await this.fetch();
  }

  // TODO: Analyze: Might be cleaner to move following functions as a property of Column class
  // but are the object instantiations worth it?

  async patch(
    columnId: Column['id'],
    properties: Omit<Partial<Column>, 'id'>,
  ): Promise<Partial<Column>> {
    const column = await this.api.update(columnId, {
      ...properties,
    });
    await this.fetch();
    await this.dispatch('columnPatched', column);
    return column;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = undefined;
    super.destroy();
  }

  async deleteColumn(columnId: Column['id']): Promise<void> {
    await this.api.remove(columnId);
    await this.dispatch('columnDeleted', columnId);
    await this.fetch();
  }
}
