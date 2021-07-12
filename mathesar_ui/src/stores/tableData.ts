import { get, writable, Writable } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar/components';

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
  pageSize: number,
  page: number,
  sort: SortOption,
  group: GroupOption
}

interface TableConfigData {
  previousTableRequest?: CancellablePromise<TableDetailsResponse>,
  previousRecordGroupRequest?: CancellablePromise<TableRecordsResponse>,
  previousRecordRequest?: CancellablePromise<TableRecordsResponse>,
}

export type TableColumnStore = Writable<TableColumnData>;
export type TableRecordStore = Writable<TableRecordData>;
export type TableOptionsStore = Writable<TableOptionsData>;

interface TableData {
  // Store objects: For use in views and controller
  columns?: TableColumnStore,
  records?: TableRecordStore,
  options?: TableOptionsStore,

  // Direct objects: For use only in controller
  config?: TableConfigData,
}

const databaseMap: Map<string, Map<number, TableData>> = new Map();

async function fetchTableDetails(db: string, id: number): Promise<void> {
  const table = databaseMap.get(db)?.get(id);
  if (table) {
    const tableColumnStore = databaseMap.get(db)?.get(id)?.columns;
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

    tableRecordStore.set({
      state: States.Loading,
      data: existingData.data,
      totalCount: existingData.totalCount,
    });

    const params = [];
    params.push(`limit=${optionData.pageSize}`);
    const offset = optionData.pageSize * (optionData.page - 1);
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

    try {
      table.config.previousRecordGroupRequest?.cancel();
      table.config.previousRecordRequest?.cancel();

      const tableRecordsPromise = getAPI<TableRecordsResponse>(`/tables/${id}/records/?${params.join('&')}`);

      let tableGroupPromise: CancellablePromise<TableRecordsResponse> = null;
      if (groupOptions.length > 0) {
        const groupParams = ['limit=100'];
        groupParams.push(
          `group_count_by=${encodeURIComponent(JSON.stringify(groupOptions))}`,
        );
        tableGroupPromise = getAPI<TableRecordsResponse>(`/tables/${id}/records/?${groupParams.join('&')}`);
      }

      table.config = {
        ...table.config,
        previousRecordRequest: tableRecordsPromise,
        previousRecordGroupRequest: tableGroupPromise,
      };

      const response = await tableRecordsPromise;
      const groupResponse = await tableGroupPromise;

      const totalCount = response.count || 0;
      const data = response.results || [];
      let groupData: TableRecordGroupData = null;
      if (groupResponse?.group_count?.results) {
        groupData = {
          fields: groupResponse.group_count?.group_count_by || [],
          count: groupResponse.group_count.results,
        };
      }
      tableRecordStore.set({
        state: States.Done,
        data,
        groupData,
        totalCount,
      });
    } catch (err) {
      tableRecordStore.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        data: [],
        totalCount: 0,
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
        totalCount: 0,
      }),
      options: writable({
        pageSize: options?.pageSize || 50,
        page: options?.page || 1,
        sort: options?.sort || null,
        group: options?.group || null,
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
