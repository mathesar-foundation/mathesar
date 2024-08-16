import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawDatabase } from './databases';

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

export const roles = {
  list: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    Array<RawRole>
  >(),
};
