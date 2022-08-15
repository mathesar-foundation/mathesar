import type { TableEntry } from '@mathesar/api/tables/tableList';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import type { IconProps } from '@mathesar/component-library/types';

export interface BreadcrumbItemDatabase {
  type: 'database';
  database: Database;
}

export interface BreadcrumbItemSchema {
  type: 'schema';
  database: Database;
  schema: SchemaEntry;
}

export interface BreadcrumbItemTable {
  type: 'table';
  database: Database;
  schema: SchemaEntry;
  table: TableEntry;
}

export type BreadcrumbItem =
  | BreadcrumbItemDatabase
  | BreadcrumbItemSchema
  | BreadcrumbItemTable;

export interface BreadcrumbSelectorEntry {
  href: string;
  label: string;
  icon: IconProps;
}

/** Keys are category names */
export type BreadcrumbSelectorData = Map<string, BreadcrumbSelectorEntry[]>;
