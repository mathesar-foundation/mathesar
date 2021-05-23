import { writable, derived, Readable } from 'svelte/store';
import { preloadCommonData, Schema } from '@mathesar/utils/preloadData';
import getAPI, { States } from './getAPI';

interface SchemaStoreData {
  toPreload?: boolean,
  state: States,
  data?: Schema[],
  error?: string
}

interface SchemaResponse {
  results: Schema[]
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
    const response = await getAPI<SchemaResponse>('/api/v0/schemas/');
    schemaWriteStore.set({
      state: States.Done,
      data: response.results,
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
      set({
        state: States.Done,
        data: preloadedData?.schemas || [],
      });
    } else {
      set($schemaWriteStore);
    }
  },
);
