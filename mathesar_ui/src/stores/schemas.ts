import { writable, derived, Readable } from 'svelte/store';
import { preloadCommonData, Schema, SchemaEntry } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

interface SchemaMapEntry extends SchemaEntry {
  children?: number[],
}

interface TableMapEntry extends SchemaEntry {
  parent?: number
}
export type SchemaMap = Map<number, SchemaMapEntry>;
export type TableMap = Map<number, TableMapEntry>;

interface SchemaStoreData {
  toPreload?: boolean,
  state: States,
  data?: Schema[],
  schemaMap?: SchemaMap,
  tableMap?: TableMap,
  error?: string
}

interface SchemaResponse {
  results: Schema[]
}

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

const schemaWriteStore = writable<SchemaStoreData>({
  toPreload: true,
  state: States.Loading,
  data: [],
});

export async function reloadSchemas(): Promise<void> {
  schemaWriteStore.update((currentData) => ({
    ...currentData,
    state: States.Loading,
  }));

  try {
    const response = await getAPI<SchemaResponse>('/schemas/');
    const data = response.results || [];
    schemaWriteStore.set({
      state: States.Done,
      data,
      ...generateEntryMaps(data),
    });
  } catch (err) {
    schemaWriteStore.set({
      state: States.Error,
      error: err instanceof Error ? err.message : null,
    });
  }
}

export const schemas: Readable<SchemaStoreData> = derived(
  schemaWriteStore,
  ($schemaWriteStore, set) => {
    if ($schemaWriteStore.toPreload) {
      const preloadedData = preloadCommonData();
      const data = preloadedData?.schemas || [];
      set({
        state: States.Done,
        data,
        ...generateEntryMaps(data),
      });
    } else {
      set($schemaWriteStore);
    }
  },
);
