import type { PaginatedResponse } from '@mathesar/api/rest/utils/requestUtils';

import type { Column } from './tables/columns';

export interface Table {
  oid: number;
  name: string;
  schema: number;
  import_verified: boolean | null;
  data_files?: number[];
  columns: Pick<
    Column,
    'id' | 'name' | 'type' | 'type_options' | 'display_options'
  >[];
  settings: {
    /** This is the settings id, not the table id */
    id: number;
    preview_settings: {
      customized: boolean;
      template: string;
    };
    column_order: number[];
  };
  description: string | null;
}

/**
 * This is the GET response for: `/api/db/v0/tables/`
 */
export type TablesList = PaginatedResponse<Table>;
