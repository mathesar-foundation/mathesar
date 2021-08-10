import type { TreeItem } from '@mathesar-components/types';

export interface Database {
  id: number,
  name: string,
  deleted: boolean,
  supported_types: string[]
}

export interface SchemaEntry {
  id: number,
  name: string
}

export interface Schema extends SchemaEntry, TreeItem {
  tables: SchemaEntry[]
}
