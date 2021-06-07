import { get, writable, Writable } from 'svelte/store';
import { getAPI, States } from '@mathesar/utils/api';

interface TableColumn {
  name: string,
  type: string
}

interface TableRecords {
  [key: string]: unknown
}

interface TableColumnData {
  state: States,
  error?: string,
  data: TableColumn[]
}

interface TableRecordData {
  state: States,
  error?: string,
  data: TableRecords[],
  totalCount: number
}

export type TableColumnStore = Writable<TableColumnData>;
export type TableRecordStore = Writable<TableRecordData>;

interface TableData {
  columns?: TableColumnStore,
  records?: TableRecordStore
}

interface TableDetailsResponse {
  columns: TableColumn[]
}

interface TableRecordsQuery {
  limit?: number,
  offset?: number
}

interface TableRecordsResponse {
  count: number,
  results: TableRecords[]
}

const databaseMap: Map<string, Map<string, TableData>> = new Map();

async function fetchTableDetails(db: string, id: string): Promise<void> {
  const tableColumnStore = databaseMap.get(db)?.get(id)?.columns;

  if (tableColumnStore) {
    const existingData = get(tableColumnStore);

    tableColumnStore.set({
      state: States.Loading,
      data: existingData.data,
    });

    try {
      const response = await getAPI<TableDetailsResponse>(`/tables/${id}/`);
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

async function fetchTableRecords(
  db: string,
  id: string,
  queryParams: TableRecordsQuery = {},
): Promise<void> {
  const tableRecordStore = databaseMap.get(db)?.get(id)?.records;

  if (tableRecordStore) {
    const existingData = get(tableRecordStore);

    tableRecordStore.set({
      state: States.Loading,
      data: existingData.data,
      totalCount: existingData.totalCount,
    });

    const params = [];
    if (typeof queryParams.limit !== 'undefined') {
      params.push(`limit=${queryParams.limit}`);
    }
    if (typeof queryParams.limit !== 'undefined') {
      params.push(`offset=${queryParams.offset}`);
    }

    try {
      const response = await getAPI<TableRecordsResponse>(`/tables/${id}/records/?${params.join('&')}`);
      const totalCount = response.count || 0;
      const data = response.results || [];
      tableRecordStore.set({
        state: States.Done,
        data,
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

export function getTable(db: string, id: string): TableData {
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
    };
    database.set(id, table);
    // eslint-disable-next-line no-void
    void fetchTableDetails(db, id);
  }
  // eslint-disable-next-line no-void
  void fetchTableRecords(db, id);
  return table;
}

export function clearTable(db: string, id: string): void {
  databaseMap.get(db)?.delete(id.toString());
}
