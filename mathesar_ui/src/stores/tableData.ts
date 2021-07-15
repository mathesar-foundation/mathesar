import { get, writable, Writable } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';

export const DEFAULT_COUNT_COL_WIDTH = 70;
export const DEFAULT_COLUMN_WIDTH = 160;

export interface TableColumn {
  name: string,
  type: string
}

export interface TableRecords {
  [key: string]: unknown
}

interface TableDetailsResponse {
  columns: TableColumn[]
}

interface TableRecordGroupsResponse {
  group_count_by: string[],
  results: Record<string, number>,
}
interface TableRecordsResponse {
  count: number,
  results: TableRecords[],
  group_count: TableRecordGroupsResponse
}

export interface TableColumnData {
  state: States,
  error?: string,
  data: TableColumn[]
}

export interface TableRecordGroupData {
  fields: string[],
  count: Record<string, number>
}

interface TableRecordData {
  state: States,
  error?: string,
  data: TableRecords[],
  groupData?: TableRecordGroupData,
  totalCount: number
}

export type SortOption = Map<string, 'asc' | 'desc'>;
export type GroupOption = Set<string>;
export interface TableOptionsData {
  limit: number,
  offset: number,
  sort: SortOption,
  group: GroupOption
}

export interface TableDisplayData {
  scrollOffset: number,
  columnPosition: Map<string, {
    width: number,
    left: number
  }>
}

interface TableConfigData {
  previousTableRequest?: CancellablePromise<TableDetailsResponse>
}

export type TableColumnStore = Writable<TableColumnData>;
export type TableRecordStore = Writable<TableRecordData>;
export type TableOptionsStore = Writable<TableOptionsData>;
export type TableDisplayStore = Writable<TableDisplayData>;

interface TableData {
  // Store objects: For use in views and controller
  columns: TableColumnStore,
  records: TableRecordStore,
  options: TableOptionsStore,
  display: TableDisplayStore,

  // Direct objects: For use only in controller
  config?: TableConfigData,
}

const databaseMap: Map<string, Map<number, TableData>> = new Map();

function calculateColumnPosition(columns: TableColumn[]): TableDisplayData['columnPosition'] {
  let left = DEFAULT_COUNT_COL_WIDTH;
  const columnPosition: TableDisplayData['columnPosition'] = new Map();
  columns.forEach((column) => {
    columnPosition.set(column.name, {
      left,
      width: DEFAULT_COLUMN_WIDTH,
    });
    left += DEFAULT_COLUMN_WIDTH;
  });
  columnPosition.set('__row', {
    width: left,
    left: 0,
  });
  return columnPosition;
}

async function fetchTableDetails(db: string, id: number): Promise<void> {
  const table = databaseMap.get(db)?.get(id);
  if (table) {
    const tableColumnStore = table.columns;
    const tableDisplayStore = table.display;
    const existingData = get(tableColumnStore);

    tableColumnStore.set({
      state: States.Loading,
      data: existingData.data,
    });

    try {
      table.config.previousTableRequest?.cancel();

      const tableDetailsPromise = getAPI<TableDetailsResponse>(`/tables/${id}/`);
      table.config = {
        ...table.config,
        previousTableRequest: tableDetailsPromise,
      };

      const response = await tableDetailsPromise;
      const columns = response.columns || [];
      tableColumnStore.set({
        state: States.Done,
        data: columns,
      });

      const existingDisplayData = get(tableDisplayStore);
      const columnPosition = calculateColumnPosition(columns);

      tableDisplayStore.set({
        ...existingDisplayData,
        columnPosition,
      });
    } catch (err) {
      tableColumnStore.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
      });
    }
  }
}

export async function fetchTableRecords(
  db: string,
  id: number,
): Promise<void> {
  const table = databaseMap.get(db)?.get(id);
  if (table) {
    const tableRecordStore = table.records;
    const optionStore = table.options;

    const existingData = get(tableRecordStore);
    const optionData = get(optionStore);

    // const requestedOffset = optionData.pageSize * (optionData.page - 1);
    const requestedOffset = optionData.offset;
    let offset: number = null;
    let limit: number = null;

    // Set offset as the first empty item index in range
    // If range is empty, this will break on 1 loop
    for (let i = requestedOffset; i < requestedOffset + optionData.limit; i += 1) {
      if (!existingData.data[i]) {
        offset = i;
        break;
      }
    }

    // Return if range is already loaded
    if (offset === null) {
      return;
    }

    // Set limit based on last empty item index in range
    // If range is empty, this will break on 1 loop
    for (let i = requestedOffset + optionData.limit - 1; i >= requestedOffset; i -= 1) {
      if (!existingData.data[i]) {
        limit = i - offset + 1;
        break;
      }
    }

    // Limit should have already been set here.

    // Set all elements in new range to state: loading
    // Using the same object to not trigger an immediate re-render
    for (let i = offset; i < offset + limit; i += 1) {
      /**
       * There may be a case where a smaller range is already loaded
       * within the specified range.
       *
       * So, updating only empty elements
       */
      if (!existingData.data[i]) {
        existingData.data[i] = { __state: 'loading' };
      }
    }

    tableRecordStore.set({
      ...existingData,
      state: States.Loading,
      error: null,
    });

    const params = [];
    params.push(`limit=${limit}`);
    params.push(`offset=${offset}`);

    const groupOptions = Array.from(optionData.group ?? []);
    const sortOptions = groupOptions.map((field) => ({
      field,
      direction: 'asc',
    }));
    optionData.sort?.forEach((value, key) => {
      sortOptions.push({
        field: key,
        direction: value,
      });
    });
    if (sortOptions.length > 0) {
      params.push(`order_by=${encodeURIComponent(JSON.stringify(sortOptions))}`);
    }
    // Commented out until group implementation is complete
    // if (groupOptions.length > 0) {
    //   params.push(
    //     `group_count_by=${encodeURIComponent(JSON.stringify(groupOptions))}`,
    //   );
    // }

    try {
      const tableRecordsPromise = getAPI<TableRecordsResponse>(`/tables/${id}/records/?${params.join('&')}`);
      const response = await tableRecordsPromise;
      const totalCount = response.count || 0;
      const data = response.results || [];

      // Getting from store again, since state may have changed
      const records = [...get(tableRecordStore).data];
      records.length = totalCount;

      for (
        let i = offset, j = 0;
        i < offset + limit && j < data.length;
        i += 1, j += 1
      ) {
        records[i] = data[j];
      }

      let groupData: TableRecordGroupData = null;
      if (response?.group_count?.results) {
        groupData = {
          fields: response.group_count?.group_count_by || [],
          count: response.group_count.results,
        };
      }
      tableRecordStore.set({
        state: States.Done,
        data: records,
        groupData,
        totalCount,
      });
    } catch (err) {
      tableRecordStore.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        totalCount: null,
      });
    }
  }
}

export function getTable(db: string, id: number, options?: Partial<TableOptionsData>): TableData {
  let database = databaseMap.get(db);
  if (!database) {
    database = new Map();
    databaseMap.set(db, database);
  }

  let table = database.get(id);
  if (!table) {
    table = {
      columns: writable({
        state: States.Loading,
        data: [],
      }),
      records: writable({
        state: States.Loading,
        data: [],
        totalCount: null,
      }),
      options: writable({
        limit: options?.limit || 40,
        offset: options?.offset || 0,
        sort: options?.sort || null,
        group: options?.group || null,
      }),
      display: writable({
        scrollOffset: 0,
        columnPosition: new Map(),
      }),
      config: {},
    };
    database.set(id, table);
    void fetchTableDetails(db, id);
  }
  void fetchTableRecords(db, id);
  return table;
}

export function clearTable(db: string, id: number): void {
  databaseMap.get(db)?.delete(id);
}
