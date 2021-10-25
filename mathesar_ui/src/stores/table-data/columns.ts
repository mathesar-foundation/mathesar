import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  postAPI,
  deleteAPI,
} from '@mathesar/utils/api';
import { TabularType } from '@mathesar/App.d';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry } from '@mathesar/App.d';
import type { Meta } from './meta';

export interface TableColumn {
  name: string,
  type: string,
  index: number,
  nullable: boolean,
  primary_key: boolean,
  valid_target_types: string[],
  __columnIndex?: number,
}

export interface TableColumnData {
  state: States,
  error?: string,
  data: TableColumn[],
  primaryKey?: string,
}

function preprocessColumns(response?: TableColumn[]): TableColumn[] {
  let index = 0;
  return response?.map((column) => {
    const newColumn = {
      ...column,
      __columnIndex: index,
    };
    index += 1;
    return newColumn;
  }) || [];
}

export class Columns implements Writable<TableColumnData> {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private store: Writable<TableColumnData>;

  private promise: CancellablePromise<PaginatedResponse<TableColumn>>;

  private url: string;

  private meta: Meta;

  private fetchCallback: (storeData: TableColumnData) => void;

  private listeners: Map<string, Set<((value?: unknown) => unknown)>>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    fetchCallback?: (storeData: TableColumnData) => void,
  ) {
    this.type = type;
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      data: [],
      primaryKey: null,
    });
    this.meta = meta;
    this.url = `/${this.type === TabularType.Table ? 'tables' : 'views'}/${this.parentId}/columns/`;
    this.fetchCallback = fetchCallback;
    this.listeners = new Map();
    void this.fetch();
  }

  set(value: TableColumnData): void {
    this.store.set(value);
  }

  update(updater: Updater<TableColumnData>): void {
    this.store.update(updater);
  }

  subscribe(
    run: Subscriber<TableColumnData>,
  ): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): TableColumnData {
    return getStoreValue(this.store);
  }

  on(eventName: string, callback: (value?: unknown) => unknown): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => {
      this.listeners?.get(eventName)?.delete(callback);
    };
  }

  private callListeners(eventName: string, value: unknown): void {
    this.listeners?.get(eventName)?.forEach((entry) => {
      try {
        entry?.(value);
      } catch (err) {
        console.error(`Failed to call a listener for ${eventName}`, err);
      }
    });
  }

  async fetch(): Promise<TableColumnData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this.promise?.cancel();
      this.promise = getAPI<PaginatedResponse<TableColumn>>(`${this.url}?limit=500`);

      const response = await this.promise;
      const columnResponse = preprocessColumns(response.results);
      const pkColumn = columnResponse.find((column) => column.primary_key);

      const storeData: TableColumnData = {
        state: States.Done,
        data: columnResponse,
        primaryKey: pkColumn?.name || null,
      };
      this.set(storeData);
      this.fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        primaryKey: null,
      });
    } finally {
      this.promise = null;
    }
    return null;
  }

  async add(newColumn: Partial<TableColumn>): Promise<Partial<TableColumn>> {
    const column = await postAPI<Partial<TableColumn>>(this.url, newColumn);
    await this.fetch();
    return column;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
    this.listeners.clear();
  }

  async deleteColumn(columnId:number):Promise<void> {
    await deleteAPI(`${this._url}${columnId}/`);
  }
}
