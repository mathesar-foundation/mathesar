import { get, derived, writable } from 'svelte/store';
import { preloadRouteData } from '@mathesar/utils/preloadData';
import getAPI from './getAPI';

const selectedTable = writable(null);

export const setSelectedTable = (tableId) => {
  if (get(selectedTable) !== tableId) {
    selectedTable.set(tableId);
  }
};

export const tables = derived(selectedTable, ($selectedTable, set) => {
  if ($selectedTable) {
    const tableDetail = preloadRouteData('table-detail');
    if (tableDetail) {
      set({
        state: 'done',
        data: tableDetail,
      });
    } else {
      set({
        state: 'loading',
        data: {},
      });

      getAPI(`/api/v0/tables/${$selectedTable}/`, (response) => {
        const result = {
          state: 'done',
          data: response,
        };
        set(result);
        return result;
      }, (error) => {
        set({
          state: 'error',
          error,
        });
      });
    }
  } else {
    set({
      state: 'done',
      data: {},
    });
  }
});

export const records = derived(selectedTable, ($selectedTable, set) => {
  if ($selectedTable) {
    const tableRecords = preloadRouteData('table-records');
    if (tableRecords) {
      set({
        state: 'done',
        data: {
          results: tableRecords,
        },
      });
    } else {
      set({
        state: 'loading',
        data: {},
      });

      getAPI(`/api/v0/tables/${$selectedTable}/records/`, (response) => {
        const result = {
          state: 'done',
          data: response,
        };
        set(result);
        return result;
      }, (error) => {
        set({
          state: 'error',
          error,
        });
      });
    }
  } else {
    set({
      state: 'done',
      data: {},
    });
  }
});
