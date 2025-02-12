import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawConfiguredRole, RawRole } from './roles';
import type { RawServer } from './servers';

export interface RawDatabase {
  id: number;
  name: string;
  server_id: RawServer['id'];
  last_confirmed_sql_version: string;
  needs_upgrade_attention: boolean;
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
  'bike_shop',
  'hardware_store',
  'ice_cream_employees',
  'library_makerspace',
  'library_management',
  'museum_exhibits',
  'nonprofit_grants',
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

export type SystemSchema = 'msar' | '__msar' | 'mathesar_types';

export const databases = {
  get: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    RawUnderlyingDatabase
  >(),
  upgrade_sql: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      username?: string;
      password?: string;
    },
    void
  >(),
  configured: {
    list: rpcMethodTypeContainer<
      {
        server_id?: RawDatabase['server_id'];
      },
      Array<RawDatabase>
    >(),
    disconnect: rpcMethodTypeContainer<
      {
        database_id: RawDatabase['id'];
        schemas_to_remove?: SystemSchema[];
        strict?: boolean;
        role_name?: string;
        password?: string;
        disconnect_db_server?: boolean;
      },
      void
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
