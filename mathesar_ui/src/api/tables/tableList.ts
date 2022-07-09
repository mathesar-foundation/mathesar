import type { PaginatedResponse } from '@mathesar/utils/api';
import type { Column } from './columns';

type MinimalColumnDetails = Pick<
  Column,
  'id' | 'name' | 'type' | 'type_options' | 'display_options'
>;

/**
 * endpoint: /api/db/v0/tables/<table_id>/
 */

export interface TableEntry {
  id: number;
  name: string;
  schema: number;
  import_verified: boolean;
  data_files?: number[];
  columns: MinimalColumnDetails[];
}

/**
 * endpoint: /api/db/v0/tables/
 */

export type TablesList = PaginatedResponse<TableEntry>;

/**
 * endpoint: /api/db/v0/tables/<table_id>/joinable_tables/
 */

type ForeignKeyId = number;
type IsLinkReversed = boolean;
export type JpPath = [Column['id'], Column['id']][];

export interface JoinableTable {
  target: TableEntry['id']; // baseTableId
  jp_path: JpPath;
  fk_path: [ForeignKeyId, IsLinkReversed][];
  depth: number;
  multiple_results: boolean;
}

export interface JoinableTableResult {
  joinable_tables: JoinableTable[];
  tables: Record<
    string, // tableId
    {
      name: TableEntry['name'];
      columns: Column['id'][];
    }
  >;
  columns: Record<
    string, // columnId
    {
      name: Column['name'];
      type: Column['type'];
    }
  >;
}
