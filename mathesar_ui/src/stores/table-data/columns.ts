import { writable, get as getStoreValue } from 'svelte/store';
import {
  deleteAPI,
  getAPI,
  postAPI,
  States,
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

export interface Column {
  name: string,
  type: string,
  index: number,
  nullable: boolean,
  primary_key: boolean,
  valid_target_types: string[],
  __columnIndex?: number,
}

export interface ColumnsData {
  state: States,
  error?: string,
  columns: Column[],
  primaryKey?: string,
}

function preprocessColumns(response?: Column[]): Column[] {
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

function api(url: string) {
  return {
    get() {
      return getAPI<PaginatedResponse<Column>>(`${url}?limit=500`);
    },
    add(columnDetails: Partial<Column>) {
      return postAPI<Partial<Column>>(url, columnDetails);
    },
    remove(index: Column['index']) {
      return deleteAPI(`${url}${index}`);
    },
  };
}

export class ColumnsDataStore implements Writable<ColumnsData> {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private store: Writable<ColumnsData>;

  private promise: CancellablePromise<PaginatedResponse<Column>>;

  private api: ReturnType<typeof api>;

  private meta: Meta;

  private fetchCallback: (storeData: ColumnsData) => void;

  private listeners: Map<string, Set<((value?: unknown) => unknown)>>;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    fetchCallback?: (storeData: ColumnsData) => void,
  ) {
    this.type = type;
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      columns: [],
      primaryKey: null,
    });
    this.meta = meta;
    this.api = api(`/${this.type === TabularType.Table ? 'tables' : 'views'}/${this.parentId}/columns/`);
    this.fetchCallback = fetchCallback;
    this.listeners = new Map();
    void this.fetch();
  }

  set(value: ColumnsData): void {
    this.store.set(value);
  }

  update(updater: Updater<ColumnsData>): void {
    this.store.update(updater);
  }

  subscribe(
    run: Subscriber<ColumnsData>,
  ): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): ColumnsData {
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

  async fetch(): Promise<ColumnsData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this.promise?.cancel();
      this.promise = this.api.get();

      const response = await this.promise;
      const columnResponse = preprocessColumns(response.results);
      const pkColumn = columnResponse.find((column) => column.primary_key);

      const storeData: ColumnsData = {
        state: States.Done,
        columns: columnResponse,
        primaryKey: pkColumn?.name || null,
      };
      this.set(storeData);
      this.fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        columns: [],
        primaryKey: null,
      });
    } finally {
      this.promise = null;
    }
    return null;
  }

  async add(columnDetails: Partial<Column>): Promise<Partial<Column>> {
    const column = await this.api.add(columnDetails);
    await this.fetch();
    return column;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
    this.listeners.clear();
  }
}
