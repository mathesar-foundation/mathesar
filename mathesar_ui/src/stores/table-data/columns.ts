import { writable, get as getStoreValue } from 'svelte/store';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';
import { TabularType } from '@mathesar/App.d';
import { intersection } from '@mathesar/utils/language';
import { EventHandler } from '@mathesar-component-library';

import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry, DbType } from '@mathesar/App.d';
import type { AbstractTypesMap, AbstractType } from '@mathesar/stores/abstractTypes';
import type { Meta } from './meta';

export interface Column {
  id: number,
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

export class ColumnsDataStore extends EventHandler implements Writable<ColumnsData> {
  private type: TabularType;

  private parentId: DBObjectEntry['id'];

  private store: Writable<ColumnsData>;

  private promise: CancellablePromise<PaginatedResponse<Column>>;

  private api: ReturnType<typeof api>;

  private meta: Meta;

  private fetchCallback: (storeData: ColumnsData) => void;

  constructor(
    type: TabularType,
    parentId: number,
    meta: Meta,
    fetchCallback?: (storeData: ColumnsData) => void,
  ) {
    super();
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

  async setNullabilityOfColumn(
    column: Column,
    nullable: boolean,
  ): Promise<void> {
    if (column.primary_key) {
      throw new Error(`Column "${column.name}" cannot allow NULL because it is a primary key.`);
    }
    await this.api.update(column.id, { nullable });
    await this.fetch();
  }

  // TODO: Analyze: Might be cleaner to move following functions as a property of Column class
  // but are the object instantiations worth it?

  async patchType(columnId: Column['id'], type: DbType): Promise<Partial<Column>> {
    const column = await this.api.update(columnId, { type });
    await this.fetch();
    this.dispatch('columnPatched', column);
    return column;
  }

  /**
   * Getting store data as argument for reactivity in components
   * Another approach would be to subscribe to types store on class initialization
   *  - That would require us to store the database id in Columns (which is probably a good idea)
   *  - It would lead to calculation of allowed types when columns are fetched. Considering that
   *    this would only be required when user opens particular views, it seems unnecessary.
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
    super.destroy();
  }

  async deleteColumn(columnId: Column['id']): Promise<void> {
    await this.api.remove(columnId);
    await this.fetch();
  }
}
