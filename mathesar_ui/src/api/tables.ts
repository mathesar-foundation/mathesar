import type { PaginatedResponse } from '@mathesar/utils/api';
import type { Column } from './tables/columns';

export type MinimalColumnDetails = Pick<
  Column,
  'id' | 'name' | 'type' | 'type_options' | 'display_options'
>;

export interface TableSettings {
  /** This is the settings id, not the table id */
  id: number;
  preview_settings: {
    customized: boolean;
    template: string;
  };
}

/**
 * This is the GET response for: `/api/db/v0/tables/<table_id>/`
 *
 * TODO: Rename this to TableInstance
 */
export interface TableEntry {
  id: number;
  name: string;
  schema: number;
  import_verified: boolean;
  data_files?: number[];
  columns: MinimalColumnDetails[];
  settings: TableSettings;
  description: string | null;
}

/**
 * This is the GET response for: `/api/db/v0/tables/`
 */
export type TablesList = PaginatedResponse<TableEntry>;
