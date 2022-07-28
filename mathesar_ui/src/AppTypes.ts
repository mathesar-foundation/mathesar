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
}

export interface SchemaEntry extends DBObjectEntry {
  has_dependencies: boolean;
}

export interface ViewEntry extends DBObjectEntry {
  // TODO: Temporary, update when view endpoints are ready.
  columns: { name: string }[];
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
