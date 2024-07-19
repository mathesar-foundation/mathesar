import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface Table {
  oid: number;
  name: string;
  /** The OID of the schema containing the table */
  schema: number;
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

  get: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
    },
    Table
  >(),

  /** Returns the oid of the table created */
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
      table_name: string;
      comment: string;
      /** TODO */
      column_data_list: unknown;
      /** TODO */
      constraint_data_list: unknown;
    },
    number
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      table_data_dict: {
        name: string;
        description: string;
      };
    },
    void
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      table_oid: number;
      cascade: boolean;
    },
    void
  >(),
};
