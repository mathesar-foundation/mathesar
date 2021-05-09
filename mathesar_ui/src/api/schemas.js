import { writable, derived } from 'svelte/store';
import { preloadCommonData } from '@mathesar/utils/preloadData';
import getAPI from './getAPI';

const schemaWriteStore = writable({
  toPreload: true,
  state: 'loading',
  data: [],
});

export function reloadSchemas() {
  schemaWriteStore.update((currentData) => ({
    ...currentData,
    state: 'loading',
  }));

  getAPI('/api/v0/schemas/', (response) => {
    const result = {
      state: 'done',
      data: response.results,
    };
    schemaWriteStore.set(result);
    return result;
  }, (error) => {
    schemaWriteStore.set({
      state: 'error',
      error,
    });
  });
}

export const schemas = derived(schemaWriteStore, ($schemaWriteStore, set) => {
  if ($schemaWriteStore.toPreload) {
    const preloadedData = preloadCommonData();
    set({
      state: 'done',
      data: preloadedData?.schemas || [],
    });
  } else {
    set($schemaWriteStore);
  }
});
