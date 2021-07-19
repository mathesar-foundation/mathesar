import { get, writable, Writable } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';

export const DEFAULT_COUNT_COL_WIDTH = 70;
export const DEFAULT_COLUMN_WIDTH = 160;
export const GROUP_MARGIN_LEFT = 30;
export const GROUP_ROW_HEIGHT = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;

export interface TableColumn {
  name: string,
  type: string
}

export interface TableRecord {
  [key: string]: unknown
  __groupInfo?: {
    columns: string[]
  }
}

interface TableDetailsResponse {
  columns: TableColumn[]
}

interface TableRecordGroupsResponse {
  group_count_by: string[],
  results: { count: number, values: string[] }[],
}
interface TableRecordsResponse {
  count: number,
  results: TableRecord[],
  group_count: TableRecordGroupsResponse
}

export interface TableColumnData {
  state: States,
  error?: string,
  data: TableColumn[]
}

interface TableRecordData {
  state: States,
  error?: string,
  data: TableRecord[],
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

export type ColumnPosition = Map<string, {
  width: number,
  left: number
}>;

export type GroupIndex = {
  latest: number,
  previous: number,
  bailOutOnReset: boolean
};

export interface TableDisplayStores {
  scrollOffset: Writable<number>,
  horizontalScrollOffset: Writable<number>,
  columnPosition: Writable<ColumnPosition>,
  groupIndex: Writable<GroupIndex>
}

interface TableConfigData {
  previousTableRequest?: CancellablePromise<TableDetailsResponse>,
  previousRecordRequestSet?: Set<CancellablePromise<TableRecordsResponse>>,
}

export type TableColumnStore = Writable<TableColumnData>;
export type TableRecordStore = Writable<TableRecordData>;
export type TableOptionsStore = Writable<TableOptionsData>;
export type TableDisplayStoreList = TableDisplayStores;

interface TableData {
  // Store objects: For use in views and controller
  columns: TableColumnStore,
  records: TableRecordStore,
  options: TableOptionsStore,

  // Objects that contain stores; For use in views and controller
  display: TableDisplayStoreList,

  // Direct objects: For use only in controller
  config?: TableConfigData,
}

const databaseMap: Map<string, Map<number, TableData>> = new Map();

function calculateColumnPosition(columns: TableColumn[]): ColumnPosition {
  let left = DEFAULT_COUNT_COL_WIDTH;
  const columnPosition: ColumnPosition = new Map();
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

function checkAndSetGroupHeaderRow(
  groupColumns: TableRecordGroupsResponse['group_count_by'],
  groupResults: TableRecordGroupsResponse['results'],
  index: number,
  records: TableRecord[],
): boolean {
  let isGroup = false;

  if (index === 0) {
    isGroup = true;
  } else if (records[index - 1]?.__state === 'done') {
    // eslint-disable-next-line no-restricted-syntax
    for (const column of groupColumns) {
      if (records[index - 1][column] !== records[index][column]) {
        isGroup = true;
        break;
      }
    }
  }

  if (isGroup) {
    // eslint-disable-next-line no-param-reassign
    records[index] = {
      ...records[index],
      __groupInfo: {
        columns: groupColumns,
      },
    };
  }
  return isGroup;
}

async function fetchTableDetails(db: string, id: number): Promise<void> {
  const table = databaseMap.get(db)?.get(id);
  if (table) {
    const tableColumnStore = table.columns;
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

      const columnPosition = calculateColumnPosition(columns);
      table.display.columnPosition.set(columnPosition);
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
  reload = false,
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

    if (reload) {
      offset = requestedOffset;
      limit = optionData.limit;

      table.config.previousRecordRequestSet?.forEach((promise) => {
        promise.cancel();
      });
      table.config.previousRecordRequestSet = null;

      /**
       * To reset group index when grouped by multiple columns,
       * setting latest to null, and previous to -1.
       *
       * bailOutOnReset:true makes sure that it does not re-render
       * right away,
       */
      table.display.groupIndex.set({
        ...get(table.display.groupIndex),
        latest: null,
        previous: -1,
        bailOutOnReset: true,
      });
    } else {
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
    }

    // If reloaded, set all other elements to null
    if (reload) {
      existingData.data.length = offset + limit;
      existingData.data.fill(null);
    }

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
    if (groupOptions.length > 0) {
      params.push(
        `group_count_by=${encodeURIComponent(JSON.stringify(groupOptions))}`,
      );
    }
    const tableRecordsPromise = getAPI<TableRecordsResponse>(`/tables/${id}/records/?${params.join('&')}`);

    if (!table.config.previousRecordRequestSet) {
      table.config.previousRecordRequestSet = new Set();
    }
    table.config.previousRecordRequestSet.add(tableRecordsPromise);

    try {
      const response = await tableRecordsPromise;
      const totalCount = response.count || 0;
      const data = response.results || [];

      // Getting from store again, since state may have changed
      const records = [...get(tableRecordStore).data];
      records.length = totalCount;

      const groupColumns = response?.group_count?.group_count_by;
      const isResultGrouped = groupColumns?.length > 0;

      const groupIndexData = get(table.display.groupIndex);

      let groupedIndex = isResultGrouped
        ? groupIndexData.latest
        : null;
      let isGroupedIndexSet = false;
      for (
        let i = offset, j = 0;
        i < offset + limit && j < data.length;
        i += 1, j += 1
      ) {
        records[i] = {
          ...data[j],
          __state: 'done',
        };
        if (isResultGrouped) {
          const isRowGrouped = checkAndSetGroupHeaderRow(
            groupColumns,
            response.group_count.results,
            i,
            records,
          );
          if (isRowGrouped && !isGroupedIndexSet) {
            groupedIndex = i;
            isGroupedIndexSet = true;
          }
        }
      }

      tableRecordStore.set({
        state: States.Done,
        data: records,
        totalCount,
      });
      table.display.groupIndex.set({
        ...groupIndexData,
        latest: groupedIndex,
        bailOutOnReset: false,
      });
    } catch (err) {
      tableRecordStore.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        totalCount: null,
      });
    } finally {
      // Delete from promise set, if the promise execution is complete
      table.config.previousRecordRequestSet?.delete(tableRecordsPromise);
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
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        sort: options?.sort || null,
        group: options?.group || null,
      }),
      display: {
        horizontalScrollOffset: writable(0),
        scrollOffset: writable(0),
        columnPosition: writable(new Map() as ColumnPosition),
        groupIndex: writable({
          latest: null,
          previous: null,
          bailOutOnReset: false,
        }),
      },
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
