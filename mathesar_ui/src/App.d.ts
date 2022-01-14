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

export interface TableEntry extends DBObjectEntry {
  schema: SchemaEntry['id'];
  import_verified: boolean;
  data_files?: number[];
  // TODO: Verify if order is stored in table model or column model
  columns: { name: string }[];
}

export interface ViewEntry extends DBObjectEntry {
  // TODO: Temporary, update when view endpoints are ready.
  columns: { name: string }[];
}

export interface SchemaResponse extends SchemaEntry, TreeItem {
  tables: DBObjectEntry[];
}

// TODO: Come up with a better name for representing both tables and views
export enum TabularType {
  Table = 1,
  View = 2,
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
