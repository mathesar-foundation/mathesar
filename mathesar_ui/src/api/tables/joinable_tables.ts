/**
 * @file
 *
 * endpoint: /api/db/v0/tables/<table_id>/joinable_tables/
 */

import type { TableEntry } from '@mathesar/api/tables';
import type { Column } from './columns';

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
