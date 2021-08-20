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

export interface Schema extends SchemaEntry, TreeItem {
  tables: Map<DBObjectEntry['id'], DBObjectEntry>
}

export interface SchemaResponse extends SchemaEntry, TreeItem {
  tables: DBObjectEntry[],
}
