import type { Writable, Updater, Subscriber, Unsubscriber } from 'svelte/store';
import { writable, get as getStoreValue } from 'svelte/store';
import type { DBObjectEntry } from '@mathesar/AppTypes';
import type { CancellablePromise } from '@mathesar-component-library';
import { EventHandler } from '@mathesar-component-library';
import type { Column } from '@mathesar/api/tables/columns';
import type { PaginatedResponse } from '@mathesar/utils/api';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';

export interface ColumnsData {
  state: States;
  error?: string;
  columns: Column[];
  primaryKeyColumnId?: number;
}

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

export class ColumnsDataStore
  extends EventHandler<{
    columnRenamed: number;
    columnAdded: Partial<Column>;
    columnDeleted: number;
    columnPatched: Partial<Column>;
    columnsFetched: Column[];
  }>
  implements Writable<ColumnsData>
{
  private parentId: DBObjectEntry['id'];

  private store: Writable<ColumnsData>;

  private promise: CancellablePromise<PaginatedResponse<Column>> | undefined;

  private api: ReturnType<typeof api>;

  private fetchCallback: (storeData: ColumnsData) => void;

  constructor(
    parentId: number,
    fetchCallback: (storeData: ColumnsData) => void = () => {},
  ) {
    super();
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      columns: [],
      primaryKey: undefined,
    });
    this.api = api(`/api/db/v0/tables/${this.parentId}/columns/`);
    this.fetchCallback = fetchCallback;
    void this.fetch();
  }

  set(value: ColumnsData): void {
    this.store.set(value);
  }

  update(updater: Updater<ColumnsData>): void {
    this.store.update(updater);
  }

  subscribe(run: Subscriber<ColumnsData>): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): ColumnsData {
    return getStoreValue(this.store);
  }

  getColumnsByIds(ids: Column['id'][]): Column[] {
    return this.get().columns.filter((column) => ids.includes(column.id));
  }

  async fetch(): Promise<ColumnsData | undefined> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this.promise?.cancel();
      this.promise = this.api.get();

      const response = await this.promise;
      const columns = response.results;
      const pkColumn = columns.find((column) => column.primary_key);

      const storeData: ColumnsData = {
        state: States.Done,
        columns,
        primaryKeyColumnId: pkColumn?.id,
      };
      this.set(storeData);
      this.fetchCallback?.(storeData);
      await this.dispatch('columnsFetched', storeData.columns);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : undefined,
        columns: [],
        primaryKeyColumnId: undefined,
      });
    } finally {
      this.promise = undefined;
    }
    return undefined;
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
