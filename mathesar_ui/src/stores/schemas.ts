import {
  writable,
  derived,
  Writable,
  Readable,
  get,
} from 'svelte/store';

import { preloadCommonData } from '@mathesar/utils/preloadData';
import { getAPI, PaginatedResponse, States } from '@mathesar/utils/api';

import type { Database, Schema, SchemaEntry } from '@mathesar/App.d';
import type { CancellablePromise } from '@mathesar/components';

import { selectedDB } from './databases';

// TODO:
// Find schema from table, if open
// Get first schema of DB by default
export const selectedSchema: Writable<Schema> = writable(null as Schema);

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

    if (!get(selectedSchema) && data.length > 0) {
      selectedSchema.set(data[0]);
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

function getSchema(database: string): Writable<SchemaStoreData> {
  let store = dbSchemaStoreMap.get(database);
  if (!store) {
    // TODO: Set and check selectedDB in preloaded data
    if (preload) {
      preload = false;
      const preloadedSchemas = preloadCommonData().schemas;
      store = writable({
        state: States.Done,
        data: preloadedSchemas,
        ...generateEntryMaps(preloadedSchemas),
      });
    } else {
      store = writable({
        state: States.Loading,
      });
      void fetchSchemas(database);
    }
  } else if (get(store).error) {
    void fetchSchemas(database);
  }
  return store;
}

export const schemas: Readable<Writable<SchemaStoreData>> = derived(
  selectedDB,
  ($selectedDB, set) => {
    if ($selectedDB) {
      set(getSchema($selectedDB.name));
    } else {
      set(null);
    }
  },
);
