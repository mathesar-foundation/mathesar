import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawRole } from './roles';

export const allSchemaPrivileges = ['USAGE', 'CREATE'] as const;
export type SchemaPrivilege = (typeof allSchemaPrivileges)[number];

export interface RawSchema {
  oid: number;
  name: string;
  description: string;
  table_count: number;
  owner_oid: RawRole['oid'];
  current_role_priv: SchemaPrivilege[];
  current_role_owns: boolean;
}

export const schemas = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
    },
    RawSchema[]
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
