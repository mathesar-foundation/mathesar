import type { QueryInstance } from '@mathesar/api/queries';
import type { TableEntry } from '@mathesar/api/tables';
import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import type {
  ComponentAndProps,
  IconProps,
} from '@mathesar/component-library/types';

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

export interface BreadcrumbItemSimple {
  type: 'simple';
  href: string;
  label: string | ComponentAndProps;
  icon?: IconProps;
}

export interface BreadcrumbItemRecord {
  type: 'record';
  database: Database;
  schema: SchemaEntry;
  table: TableEntry;
  record: {
    id: number;
    summary: string;
  };
}

export interface BreadcrumbItemExploration {
  type: 'exploration';
  database: Database;
  schema: SchemaEntry;
  query: Pick<QueryInstance, 'id' | 'name'>;
}

export type BreadcrumbItem =
  | BreadcrumbItemDatabase
  | BreadcrumbItemSchema
  | BreadcrumbItemTable
  | BreadcrumbItemExploration
  | BreadcrumbItemRecord
  | BreadcrumbItemSimple;

export interface BaseBreadcrumbSelectorEntry {
  href: string;
  label: string;
  icon: IconProps;
  isActive(): boolean;
}

export interface SimpleBreadcrumbSelectorEntry
  extends BaseBreadcrumbSelectorEntry {
  type: 'simple';
}

export interface BreadcrumbSelectorEntryForTable
  extends BaseBreadcrumbSelectorEntry {
  type: 'table';
  table: TableEntry;
}

export type BreadcrumbSelectorEntry =
  | SimpleBreadcrumbSelectorEntry
  | BreadcrumbSelectorEntryForTable;

/** Keys are category names */
export type BreadcrumbSelectorData = Map<string, BreadcrumbSelectorEntry[]>;
