import { writable, get as getStoreValue } from 'svelte/store';
import {
  States,
  getAPI,
  postAPI,
  deleteAPI,
  patchAPI,
} from '@mathesar/utils/api';
import { TabularType } from '@mathesar/App.d';
import { intersection } from '@mathesar/utils/language';

import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { DBObjectEntry, DbType } from '@mathesar/App.d';
import type { AbstractTypesMap, AbstractType } from '@mathesar/stores/abstractTypes';
import type { Meta } from './meta';

export interface Column {
  name: string,
  type: DbType,
  index: number,
  nullable: boolean,
  primary_key: boolean,
  valid_target_types: DbType[],
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

export class ColumnsDataStore implements Writable<ColumnsData> {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private store: Writable<ColumnsData>;

  private promise: CancellablePromise<PaginatedResponse<Column>>;

  private url: string;

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
    this.url = `/${this.type === TabularType.Table ? 'tables' : 'views'}/${this.parentId}/columns/`;
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
      this.promise = getAPI<PaginatedResponse<Column>>(`${this.url}?limit=500`);

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

  async add(newColumn: Partial<Column>): Promise<Partial<Column>> {
    const column = await postAPI<Partial<Column>>(this.url, newColumn);
    await this.fetch();
    return column;
  }

  // TODO: Analyze: Might be cleaner to move following functions as a property of Column class
  // but are the object instantiations worth it?

  async patchType(columnIndex: Column['index'], type: DbType): Promise<Partial<Column>> {
    const column = await patchAPI<Partial<Column>>(
      `${this.url}${columnIndex}/`,
      { type },
    );
    await this.fetch();
    this.callListeners('columnPatched', column);
    return column;
  }

  /**
   * Getting store data as argument for reactivity in components
   * Another approach would be to subscribe to types store on class initialization
   *  - That would require us to store the database id in Columns (which is probably a good idea)
   *  - It would lead to calculation of allowed types when columns are fetched. Considering that
   *    this would only be required when user opens particular views, it seems unnessary.
   *  - It would cache the calculated allowed types, which benefits us.
   * TODO: Subscribe to types store from Columns, when dynamic type related information is provided
   * by server.
   */
  static getAllowedTypeConversions(
    column: Column, abstractTypesMap: AbstractTypesMap,
  ): AbstractType[] {
    const allowedTypeConversions: AbstractType[] = [];
    if (column && abstractTypesMap) {
      const dbTargetTypeSet = new Set(column.valid_target_types);
      abstractTypesMap.forEach((entry) => {
        const allowedDBTypesInMTType = intersection(
          dbTargetTypeSet,
          entry.dbTypes,
        );
        if (allowedDBTypesInMTType.length > 0) {
          allowedTypeConversions.push({
            ...entry,
            dbTypes: new Set(allowedDBTypesInMTType),
          });
        }
      });
    }
    return allowedTypeConversions;
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
    this.listeners.clear();
  }

  deleteColumn(columnId:number): Promise<void> {
    return deleteAPI(`${this.url}${columnId}/`);
  }
}
