import {
  writable,
  Writable,
  derived,
  Readable,
  get,
  Unsubscriber,
} from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, PaginatedResponse, States } from '@mathesar/utils/api';

import type { Database, Schema, SchemaEntry } from '@mathesar/App.d';
import type { CancellablePromise } from '@mathesar/components';

import { currentDB } from './databases';

const commonData = preloadCommonData();

const selected: Schema = commonData.schemas?.find(
  (entry) => entry.id === commonData.current_schema,
) || null;
export const currentSchema: Writable<Schema> = writable(selected);

interface SchemaMapEntry extends SchemaEntry {
  children?: number[],
}
interface TableMapEntry extends SchemaEntry {
  parent?: number
}
export type SchemaMap = Map<number, SchemaMapEntry>;
export type TableMap = Map<number, TableMapEntry>;

export interface SchemaStoreData {
  preload?: boolean,
  state: States,
  data?: Schema[],
  schemaMap?: SchemaMap,
  tableMap?: TableMap,
  error?: string
}

const dbSchemaStoreMap: Map<Database['name'], Writable<SchemaStoreData>> = new Map();
const dbSchemaRequestMap: Map<Database['name'], CancellablePromise<PaginatedResponse<Schema>>> = new Map();

function generateEntryMaps(data: Schema[]): { schemaMap: SchemaMap, tableMap: TableMap } {
  const schemaMap: SchemaMap = new Map();
  const tableMap: TableMap = new Map();

  data.forEach((entry) => {
    const schemaKey = entry.id;
    const tableIdList = entry.tables?.map((tableEntry) => tableEntry.id);
    schemaMap.set(schemaKey, {
      id: entry.id,
      name: entry.name,
      children: tableIdList,
    });
    entry.tables?.forEach((tableEntry) => {
      tableMap.set(tableEntry.id, {
        id: tableEntry.id,
        name: tableEntry.name,
        parent: schemaKey,
      });
    });
  });
  return {
    schemaMap,
    tableMap,
  };
}

export async function fetchSchemas(
  database: string,
): Promise<Schema[]> {
  const store = dbSchemaStoreMap.get(database);
  if (!store) {
    return [];
  }

  try {
    store.update((currentData) => ({
      ...currentData,
      state: States.Loading,
    }));

    dbSchemaRequestMap.get(database)?.cancel();

    const schemaRequest = getAPI<PaginatedResponse<Schema>>(`/schemas/?database=${database}`);
    dbSchemaRequestMap.set(database, schemaRequest);
    const response = await schemaRequest;
    const data = response.results || [];

    store.set({
      state: States.Done,
      data,
      ...generateEntryMaps(data),
    });

    if (!get(currentSchema) && data.length > 0) {
      currentSchema.set(data[0]);
    }

    return data;
  } catch (err) {
    store.set({
      state: States.Error,
      error: err instanceof Error ? err.message : 'Error in fetching schemas',
    });
    return [];
  }
}

let preload = true;

export function getSchemaStore(database: string): Writable<SchemaStoreData> {
  let store = dbSchemaStoreMap.get(database);
  if (!store) {
    // TODO: Set and check currentDB in preloaded data
    if (preload) {
      preload = false;
      store = writable({
        state: States.Done,
        data: commonData.schemas,
        ...generateEntryMaps(commonData.schemas),
      });
    } else {
      store = writable({
        state: States.Loading,
      });
      void fetchSchemas(database);
    }
    dbSchemaStoreMap.set(database, store);
  } else if (get(store).error) {
    void fetchSchemas(database);
  }
  return store;
}

export const schemas: Readable<SchemaStoreData> = derived(
  currentDB,
  ($currentDB, set) => {
    let unsubscribe: Unsubscriber;

    if (!$currentDB) {
      set({
        state: States.Done,
        data: [],
      });
    } else {
      const store = getSchemaStore($currentDB.name);
      unsubscribe = store.subscribe((schemaData) => {
        set(schemaData);
      });
    }

    return () => {
      unsubscribe?.();
    };
  },
);
