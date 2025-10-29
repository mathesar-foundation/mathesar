import type { Database } from '@mathesar/models/Database';
import type { Table } from '@mathesar/models/Table';
import type { CancellablePromise } from '@mathesar-component-library';

import { uploadFile } from './utils/requestUtils';

const ENDPOINT = '/bulk_insert/';

export interface ImportColumnMappingEntry {
  csv_column: {
    index: number;
    name?: string;
  };
  table_column: number | null;
}

export type ImportColumnMapping = ImportColumnMappingEntry[];

export function bulkInsert(props: {
  database: Pick<Database, 'id'>;
  table: Pick<Table, 'oid'>;
  file: File;
  headerRow: boolean;
  columnMapping: ImportColumnMapping;
}): CancellablePromise<{ inserted_rows: number }> {
  const formData = new FormData();
  formData.append('header', props.headerRow ? 'true' : '');
  formData.append('database_id', String(props.database.id));
  formData.append('target_table_oid', String(props.table.oid));
  formData.append('file', props.file);
  formData.append('mappings', JSON.stringify(props.columnMapping));
  return uploadFile(ENDPOINT, formData);
}
