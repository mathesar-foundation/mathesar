import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawDatabase } from './databases';
import type { RawServer } from './servers';

export interface RawRoleMember {
  oid: number;
  admin: boolean;
}

export interface RawRole {
  oid: number;
  name: string;
  super: boolean;
  inherits: boolean;
  create_role: boolean;
  create_db: boolean;
  login: boolean;
  description?: string;
  members?: RawRoleMember[];
}

export interface RawConfiguredRole {
  id: number;
  server_id: RawServer['id'];
  name: string;
}

export const roles = {
  list: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    Array<RawRole>
  >(),

  add: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      rolename: RawRole['name'];
      login: boolean;
      password?: string;
    },
    RawRole
  >(),

  set_members: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      role_oid: RawRole['oid'];
      members: RawRole['oid'][];
    },
    RawRole
  >(),

  get_current_role: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    {
      current_role: RawRole;
      parent_roles: RawRole[];
    }
  >(),

  delete: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      role_oid: RawRole['oid'];
    },
    void
  >(),

  configured: {
    list: rpcMethodTypeContainer<
      {
        server_id: RawConfiguredRole['server_id'];
      },
      Array<RawConfiguredRole>
    >(),

    add: rpcMethodTypeContainer<
      {
        server_id: RawConfiguredRole['server_id'];
        name: RawConfiguredRole['name'];
        password: string;
      },
      RawConfiguredRole
    >(),

    delete: rpcMethodTypeContainer<
      {
        configured_role_id: RawConfiguredRole['id'];
      },
      void
    >(),

    set_password: rpcMethodTypeContainer<
      {
        configured_role_id: RawConfiguredRole['id'];
        password: string;
      },
      void
    >(),
  },
};
