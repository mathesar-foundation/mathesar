import type { SavedExploration } from '@mathesar/api/rpc/explorations';
import type { Database } from '@mathesar/models/Database';
import type { Schema } from '@mathesar/models/Schema';
import type { Table } from '@mathesar/models/Table';
import type {
  ComponentAndProps,
  IconProps,
} from '@mathesar-component-library/types';

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
  prependSeparator?: boolean;
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
  getFilterableText(): string;
  isActive(): boolean;
}

export interface SimpleBreadcrumbSelectorEntry
  extends BaseBreadcrumbSelectorEntry {
  type: 'simple';
  label: string;
  icon: IconProps;
}

export interface BreadcrumbSelectorEntryForTable
  extends BaseBreadcrumbSelectorEntry {
  type: 'table';
  table: Table;
}

export interface BreadcrumbSelectorEntryForExploration
  extends BaseBreadcrumbSelectorEntry {
  type: 'exploration';
  exploration: SavedExploration;
}

export interface BreadcrumbSelectorEntryForSchema
  extends BaseBreadcrumbSelectorEntry {
  type: 'schema';
  schema: Schema;
}

export interface BreadcrumbSelectorEntryForDatabase
  extends BaseBreadcrumbSelectorEntry {
  type: 'database';
  database: Database;
}

export type BreadcrumbSelectorEntry =
  | SimpleBreadcrumbSelectorEntry
  | BreadcrumbSelectorEntryForTable
  | BreadcrumbSelectorEntryForExploration
  | BreadcrumbSelectorEntryForSchema
  | BreadcrumbSelectorEntryForDatabase;

export interface BreadcrumbSelectorSectionData {
  label: string;
  entries: BreadcrumbSelectorEntry[];
  emptyMessage: string;
}
