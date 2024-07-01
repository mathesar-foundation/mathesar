import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface Schema {
  oid: number;
  name: string;
  description: string;
  table_count: number;
}

export const schemas = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
    },
    Schema[]
  >(),

  /** Returns the OID of the newly-created schema */
  add: rpcMethodTypeContainer<
    {
      database_id: number;
      name: string;
      description?: string;
    },
    number
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
      patch: {
        name?: string;
        description?: string;
      };
    },
    void
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
    },
    void
  >(),
};
