import { writable, get as getStoreValue } from 'svelte/store';
import { States, getAPI, postAPI } from '@mathesar/utils/api';
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
  _type: TabularType;

  _parentId: DBObjectEntry['id'];

  _store: Writable<TableColumnData>;

  _promise: CancellablePromise<PaginatedResponse<TableColumn>>;

  _url: string;

  _meta: Meta;

  _fetchCallback: (storeData: TableColumnData) => void;

  _listeners: Map<string, Set<((value?: unknown) => unknown)>>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    fetchCallback?: (storeData: TableColumnData) => void,
  ) {
    this._type = type;
    this._parentId = parentId;
    this._store = writable({
      state: States.Loading,
      data: [],
      primaryKey: null,
    });
    this._meta = meta;
    this._url = `/${this._type === TabularType.Table ? 'tables' : 'views'}/${this._parentId}/columns/`;
    this._fetchCallback = fetchCallback;
    this._listeners = new Map();
    void this.fetch();
  }

  set(value: TableColumnData): void {
    this._store.set(value);
  }

  update(updater: Updater<TableColumnData>): void {
    this._store.update(updater);
  }

  subscribe(
    run: Subscriber<TableColumnData>,
  ): Unsubscriber {
    return this._store.subscribe(run);
  }

  get(): TableColumnData {
    return getStoreValue(this._store);
  }

  on(eventName: string, callback: (value?: unknown) => unknown): () => void {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(callback);
    return () => {
      this._listeners?.get(eventName)?.delete(callback);
    };
  }

  _callListeners(eventName: string, value: unknown): void {
    this._listeners?.get(eventName)?.forEach((entry) => {
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
      this._promise?.cancel();
      this._promise = getAPI<PaginatedResponse<TableColumn>>(`${this._url}?limit=500`);

      const response = await this._promise;
      const columnResponse = preprocessColumns(response.results);
      const pkColumn = columnResponse.find((column) => column.primary_key);

      const storeData: TableColumnData = {
        state: States.Done,
        data: columnResponse,
        primaryKey: pkColumn?.name || null,
      };
      this.set(storeData);
      this._fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        primaryKey: null,
      });
    } finally {
      this._promise = null;
    }
    return null;
  }

  async add(newColumn: Partial<TableColumn>): Promise<Partial<TableColumn>> {
    const column = await postAPI<Partial<TableColumn>>(this._url, newColumn);
    await this.fetch();
    return column;
  }

  destroy(): void {
    this._promise?.cancel();
    this._promise = null;
    this._listeners.clear();
  }
}
