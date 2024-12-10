import type { SavedExploration } from '@mathesar/api/rpc/explorations';
import type {
  ComponentAndProps,
  IconProps,
} from '@mathesar/component-library/types';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';

export interface BreadcrumbItemDatabase {
  type: 'database';
  database: Database;
}

export interface BreadcrumbItemSchema {
  type: 'schema';
  database: Database;
  schema: Schema;
}

export interface BreadcrumbItemTable {
  type: 'table';
  database: Database;
  schema: Schema;
  table: Table;
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
  schema: Schema;
  table: Table;
  record: {
    pk: string;
    summary: string;
  };
}

export interface BreadcrumbItemExploration {
  type: 'exploration';
  database: Database;
  schema: Schema;
  query: Pick<SavedExploration, 'id' | 'name'>;
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
  table: Table;
}

export type BreadcrumbSelectorEntry =
  | SimpleBreadcrumbSelectorEntry
  | BreadcrumbSelectorEntryForTable;

/** Keys are category names */
export type BreadcrumbSelectorData = Map<string, BreadcrumbSelectorEntry[]>;
