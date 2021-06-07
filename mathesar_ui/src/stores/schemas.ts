import { writable, derived, Readable } from 'svelte/store';
import { preloadCommonData, Schema, SchemaEntry } from '@mathesar/utils/preloadData';
import { getAPI, States } from '@mathesar/utils/api';

export interface SchemaMapEntry extends SchemaEntry {
  children?: string[],
  parent?: string
}

export type SchemaTreeMapEntry = Map<string, SchemaMapEntry>;

interface SchemaStoreData {
  toPreload?: boolean,
  state: States,
  data?: Schema[],
  entryMap?: SchemaTreeMapEntry,
  error?: string
}

interface SchemaResponse {
  results: Schema[]
}

function generateEntryMap(data: Schema[]): SchemaTreeMapEntry {
  const entryMap: SchemaTreeMapEntry = new Map();
  data.forEach((entry) => {
    const schemaKey = `_s_${entry.id}`;
    entryMap.set(schemaKey, {
      id: entry.id,
      name: entry.name,
      parent: 'root',
    });
    entry.tables?.forEach((tableEntry) => {
      entryMap.set(tableEntry.id, {
        id: tableEntry.id,
        name: tableEntry.name,
        parent: schemaKey,
      });
    });
  });
  return entryMap;
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
      entryMap: generateEntryMap(data),
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
        entryMap: generateEntryMap(data),
      });
    } else {
      set($schemaWriteStore);
    }
  },
);
