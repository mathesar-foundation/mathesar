import type { TreeItem } from '@mathesar-component-library/types';

/** @deprecated Use either Connection or ConnectionModel interface instead */
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

export interface FilterConfiguration {
  db_type: DbType;
  opitons: {
    op?: string;
    value?: {
      allowed_types: DbType[];
    };
  }[];
}

export interface AbstractTypeResponse {
  name: string;
  identifier: string;
  db_types: DbType[];
  filters?: FilterConfiguration;
}
