import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawDatabase } from './databases';
import type { RawRole } from './roles';

export const allSchemaPrivileges = ['USAGE', 'CREATE'] as const;
export type SchemaPrivilege = (typeof allSchemaPrivileges)[number];

export interface RawSchema {
  oid: number;
  name: string;
  description: string | null;
  table_count: number;
  owner_oid: RawRole['oid'];
  current_role_priv: SchemaPrivilege[];
  current_role_owns: boolean;
}

export interface RawSchemaPrivilegesForRole {
  role_oid: RawRole['oid'];
  direct: SchemaPrivilege[];
}

export const schemas = {
  list: rpcMethodTypeContainer<
    {
      database_id: number;
    },
    RawSchema[]
  >(),

  add: rpcMethodTypeContainer<
    {
      database_id: number;
      name: RawSchema['name'];
      description?: RawSchema['description'];
    },
    RawSchema
  >(),

  patch: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oid: number;
      patch: {
        name?: RawSchema['name'];
        description?: RawSchema['description'];
      };
    },
    RawSchema
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: number;
      schema_oids: number[];
    },
    void
  >(),

  privileges: {
    list_direct: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        schema_oid: RawSchema['oid'];
      },
      Array<RawSchemaPrivilegesForRole>
    >(),

    replace_for_roles: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        schema_oid: RawSchema['oid'];
        privileges: Array<RawSchemaPrivilegesForRole>;
      },
      Array<RawSchemaPrivilegesForRole>
    >(),

    transfer_ownership: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        schema_oid: RawSchema['oid'];
        new_owner_oid: RawRole['oid'];
      },
      RawSchema
    >(),
  },
};
