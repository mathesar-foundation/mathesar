import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawServer } from './servers';

export interface RawConfiguredRole {
  id: number;
  server_id: RawServer['id'];
  name: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const configured_roles = {
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
};
