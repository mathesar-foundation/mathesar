import type { TreeItem } from '@mathesar-component-library/types';

interface BaseDatabase {
  id: number;
  name: string;
  editable: boolean;
  username: string;
  host: string;
  port: string;
  db_name: string;
}

export interface DatabaseWithConnectionError extends BaseDatabase {
  error: string;
}

export interface SuccessfullyConnectedDatabase extends BaseDatabase {
  supported_types: string[];
}

export type Database =
  | SuccessfullyConnectedDatabase
  | DatabaseWithConnectionError;

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
