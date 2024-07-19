import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Column } from '../rest/types/tables/columns';

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

export const tables = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
    },
    Table[]
  >(),
};
