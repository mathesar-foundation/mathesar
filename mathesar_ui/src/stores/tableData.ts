import { get, writable, Writable } from 'svelte/store';
import {
  deleteAPI, getAPI, patchAPI, States,
} from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';
import type { SelectOption } from '@mathesar-components/types';

export const DEFAULT_COUNT_COL_WIDTH = 70;
export const DEFAULT_COLUMN_WIDTH = 160;
export const GROUP_MARGIN_LEFT = 30;
export const GROUP_ROW_HEIGHT = 70;
export const DEFAULT_ROW_RIGHT_PADDING = 100;

export interface TableColumn {
  name: string,
  type: string,
  index: number,
  nullable: boolean,
  primaryKey: boolean,
  validTargetTypes: string[]
}
export interface TableRecord {
  [key: string]: unknown
  __groupInfo?: {
    columns: string[]
  }
}

export interface TableColumnResponse extends TableColumn {
  primary_key: TableColumn['primaryKey'],
  valid_target_types: TableColumn['validTargetTypes']
}

export interface TableColumnsResponse {
  count: number,
  results: TableColumnResponse[]
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
  data: TableColumn[],
  primaryKey: string,
}

export interface GroupData {
  [key: string]: GroupData | number
}

interface TableRecordData {
  state: States,
  error?: string,
  data: TableRecord[],
  totalCount: number,
  groupData: GroupData
}

export type SortOption = Map<string, 'asc' | 'desc'>;
export type GroupOption = Set<string>;

export type StringCondition = 'eq' | 'ne' | 'ilike' | 'not_ilike';
export interface FilterEntry {
  column: SelectOption,
  condition: SelectOption,
  value: string
}
export interface FilterOption {
  combination: SelectOption,
  filters: FilterEntry[]
}

export interface TableOptionsData {
  limit: number,
  offset: number,
  sort: SortOption,
  group: GroupOption,
  filter: FilterOption
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
  groupIndex: Writable<GroupIndex>,
  showDisplayOptions: Writable<boolean>,
  selected: Writable<Record<string | number, boolean>>
}

interface TableConfigData {
  previousTableRequest?: CancellablePromise<TableColumnsResponse>,
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

function combineGroups(
  groupData: GroupData,
  groupResults: TableRecordGroupsResponse['results'],
): GroupData {
  if (!groupResults) {
    return groupData;
  }
  const groupMap: GroupData = groupData || {};
  groupResults?.forEach((result) => {
    let group = groupMap;
    for (let i = 0; i < result.values.length - 1; i += 1) {
      const value = result.values[i];
      if (!group[value]) {
        group[value] = {};
      }
      group = group[value] as GroupData;
    }
    group[result.values[result.values.length - 1]] = result.count;
  });
  return groupMap;
}

function checkAndSetGroupHeaderRow(
  groupColumns: TableRecordGroupsResponse['group_count_by'],
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
    const existingColumnData = get(tableColumnStore);

    tableColumnStore.set({
      ...existingColumnData,
      state: States.Loading,
    });

    try {
      table.config.previousTableRequest?.cancel();

      const tableColumnsPromise = getAPI<TableColumnsResponse>(`/tables/${id}/columns/?limit=500`);
      table.config = {
        ...table.config,
        previousTableRequest: tableColumnsPromise,
      };

      const tableResponse = await tableColumnsPromise;
      const columnResponse = tableResponse.results || [];
      const columns: TableColumn[] = columnResponse.map((column) => {
        const converted = {
          ...column,
          primaryKey: column.primary_key,
          validTargetTypes: column.valid_target_types,
        };
        delete converted.primary_key;
        delete converted.valid_target_types;
        return converted;
      });
      const pkColumn = columns.find((column) => column.primaryKey);

      tableColumnStore.set({
        state: States.Done,
        data: columns,
        primaryKey: pkColumn?.name || null,
      });

      const columnPosition = calculateColumnPosition(columns);
      table.display.columnPosition.set(columnPosition);
    } catch (err) {
      tableColumnStore.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        primaryKey: null,
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

      // Set to empty object if query is grouped
      if (existingData.groupData && optionData.group?.size > 0) {
        existingData.groupData = {};
      } else {
        existingData.groupData = null;
      }
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
      direction: optionData.sort?.get(field) ?? 'asc',
    }));
    optionData.sort?.forEach((value, key) => {
      if (!optionData.group?.has(key)) {
        sortOptions.push({
          field: key,
          direction: value,
        });
      }
    });
    if (sortOptions.length > 0) {
      params.push(`order_by=${encodeURIComponent(JSON.stringify(sortOptions))}`);
    }
    if (groupOptions.length > 0) {
      params.push(
        `group_count_by=${encodeURIComponent(JSON.stringify(groupOptions))}`,
      );
    }
    if (optionData.filter?.filters?.length > 0) {
      const filter = {};
      const terms = optionData.filter?.filters.map((term) => ({
        field: term.column.id,
        op: term.condition.id,
        value: term.value,
      }));
      filter[optionData.filter.combination.id as string] = terms;
      params.push(
        `filters=${encodeURIComponent(JSON.stringify(filter))}`,
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
      const recordInfo = get(tableRecordStore);
      const records = [...recordInfo.data];
      records.length = totalCount;

      const groupColumns = response?.group_count?.group_count_by;
      const isResultGrouped = groupColumns?.length > 0;

      const groupData = combineGroups(
        recordInfo.groupData,
        response?.group_count?.results,
      );

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
        groupData,
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
        groupData: null,
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
        primaryKey: null,
      }),
      records: writable({
        state: States.Loading,
        data: [],
        groupData: null,
        totalCount: null,
      }),
      options: writable({
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        sort: options?.sort || null,
        group: options?.group || null,
        filter: options?.filter || null,
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
        showDisplayOptions: writable(false),
        selected: writable({}),
      },
      config: {},
    };
    database.set(id, table);
    void fetchTableDetails(db, id);
  }
  void fetchTableRecords(db, id);
  return table;
}

export async function deleteRecords(db: string, id: number, pks: string[]): Promise<void> {
  const table = databaseMap.get(db)?.get(id);
  if (table && pks.length > 0) {
    const tableRecordStore = table.records;
    const tableColumnStore = table.columns;

    const columnData = get(tableColumnStore);
    const existingData = get(tableRecordStore);

    const pkSet = new Set(pks);

    // TODO: Retain map with pk uuid hash for record operations
    const data = existingData.data.map((entry) => {
      if (entry && pkSet.has(entry[columnData.primaryKey]?.toString())) {
        return {
          ...entry,
          __state: 'deleting',
        };
      }
      return entry;
    });

    tableRecordStore.set({
      ...existingData,
      data,
    });

    try {
      const success = new Set();
      const failed = new Set();
      // TODO: Convert this to single request
      const promises = pks.map((pk) => deleteAPI<unknown>(`/tables/${id}/records/${pk}/`)
        .then(() => {
          success.add(pk);
          return success;
        })
        .catch(() => {
          failed.add(pk);
          return failed;
        }));
      await Promise.all(promises);
      await fetchTableRecords(db, id, true);

      // Getting again, since data may have changed
      const recordData = get(tableRecordStore);
      const newData: TableRecord[] = [];
      recordData.data.forEach((entry) => {
        if (entry) {
          const entryPK = entry[columnData.primaryKey]?.toString();
          if (failed.has(entryPK)) {
            newData.push({
              ...entry,
              __state: 'deletionFailed',
            });
          }
        }
        newData.push(entry);
      });

      tableRecordStore.set({
        ...recordData,
        data: newData,
      });
    } catch (err) {
      const recordData = get(tableRecordStore);
      const newData = existingData.data.map((entry) => {
        if (entry && pkSet.has(entry[columnData.primaryKey]?.toString())) {
          return {
            ...entry,
            __state: 'deletionError',
          };
        }
        return entry;
      });

      tableRecordStore.set({
        ...recordData,
        data: newData,
      });
    } finally {
      table.display.selected.set({});
    }
  }
}

export function clearTable(db: string, id: number): void {
  databaseMap.get(db)?.delete(id);
}

export async function patchColumnType(
  tableId: number,
  columnId: number,
  dbType: string,
): Promise<void> {
  await patchAPI<unknown>(
    `/tables/${tableId}/columns/${columnId}/`,
    { type: dbType },
  );
}
