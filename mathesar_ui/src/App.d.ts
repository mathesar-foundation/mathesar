import type { TreeItem } from '@mathesar-components/types';

export interface Database {
  id: number,
  name: string,
  deleted: boolean,
  supported_types: string[]
}

export interface DBObjectEntry {
  id: number,
  name: string
}

export interface SchemaEntry extends DBObjectEntry {
  has_dependencies: boolean
}

export interface TableEntry extends DBObjectEntry {
  schema: SchemaEntry['id'],
  import_verified: boolean,
  data_files?: number[],
  // TODO: Verify if order is stored in table model or column model
  columns: { name: string }[],
}

export interface SchemaResponse extends SchemaEntry, TreeItem {
  tables: DBObjectEntry[],
}
