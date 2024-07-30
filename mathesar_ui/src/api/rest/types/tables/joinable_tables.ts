/**
 * @file
 *
 * endpoint: /api/db/v0/tables/<table_id>/joinable_tables/
 */

import type { Table } from '@mathesar/api/rpc/tables';

type ForeignKeyId = number;
type IsLinkReversed = boolean;

/** [attnum, attnum][] */
export type JpPath = [number, number][];

export interface JoinableTable {
  target: Table['oid']; // baseTableId
  jp_path: JpPath;
  fk_path: [ForeignKeyId, IsLinkReversed][];
  depth: number;
  multiple_results: boolean;
}

export interface JoinableTablesResult {
  joinable_tables: JoinableTable[];
  tables: Record<
    string, // tableId
    {
      name: Table['name'];
      columns: number[];
    }
  >;
  columns: Record<
    string, // columnId
    {
      name: string;
      type: string;
    }
  >;
}
