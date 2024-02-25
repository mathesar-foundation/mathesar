import type { TreeItem } from '@mathesar-component-library/types';

/** @deprecated in favor of Connection */
export interface Database {
  id: number;
  nickname: string;
  database: string;
  username: string;
  host: string;
  port: number;
}

export interface DBObjectEntry {
  id: number;
  name: string;
  description: string | null;
}

export interface SchemaEntry extends DBObjectEntry {
  has_dependencies: boolean;
  num_tables: number;
  num_queries: number;
}

export interface SchemaResponse extends SchemaEntry, TreeItem {
  tables: DBObjectEntry[];
}

export type DbType = string;
