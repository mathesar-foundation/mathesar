import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawConfiguredRole, RawRole } from './roles';
import type { RawServer } from './servers';

export interface RawDatabase {
  id: number;
  name: string;
  server_id: RawServer['id'];
}

export const allDatabasePrivileges = [
  'CREATE',
  'CONNECT',
  'TEMPORARY',
] as const;
export type DatabasePrivilege = (typeof allDatabasePrivileges)[number];

export interface RawUnderlyingDatabase {
  oid: number;
  name: string;
  owner_oid: RawRole['oid'];
  current_role_priv: DatabasePrivilege[];
  current_role_owns: boolean;
}

export const sampleDataOptions = [
  'library_management',
  'movie_collection',
] as const;

export type SampleDataSchemaIdentifier = (typeof sampleDataOptions)[number];

export interface DatabaseConnectionResult {
  server: RawServer;
  database: RawDatabase;
  configured_role: RawConfiguredRole;
}

export interface RawDatabasePrivilegesForRole {
  role_oid: RawRole['oid'];
  direct: DatabasePrivilege[];
}

export const databases = {
  get: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    RawUnderlyingDatabase
  >(),
  configured: {
    list: rpcMethodTypeContainer<
      {
        server_id?: RawDatabase['server_id'];
      },
      Array<RawDatabase>
    >(),
  },
  setup: {
    create_new: rpcMethodTypeContainer<
      {
        database: RawDatabase['name'];
        sample_data?: SampleDataSchemaIdentifier[];
      },
      DatabaseConnectionResult
    >(),
    connect_existing: rpcMethodTypeContainer<
      {
        host: RawServer['host'];
        port: RawServer['port'];
        database: RawDatabase['name'];
        role: RawConfiguredRole['name'];
        password: string;
        sample_data?: SampleDataSchemaIdentifier[];
      },
      DatabaseConnectionResult
    >(),
  },
  privileges: {
    list_direct: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
      },
      Array<RawDatabasePrivilegesForRole>
    >(),
    replace_for_roles: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        privileges: Array<RawDatabasePrivilegesForRole>;
      },
      Array<RawDatabasePrivilegesForRole>
    >(),
    transfer_ownership: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        new_owner_oid: RawRole['oid'];
      },
      RawUnderlyingDatabase
    >(),
  },
};
