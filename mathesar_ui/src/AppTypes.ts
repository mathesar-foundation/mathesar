import type { TreeItem } from '@mathesar-component-library/types';

export interface Database {
  id: number;
  name: string;
  deleted: boolean;
  supported_types: string[];
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
