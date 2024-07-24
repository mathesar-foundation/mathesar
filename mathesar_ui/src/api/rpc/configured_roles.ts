import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Server } from './servers';

export interface ConfiguredRole {
  id: number;
  server_id: Server['id'];
  name: string;
}

export const configuredRoles = {
  list: rpcMethodTypeContainer<
    {
      server_id: ConfiguredRole['server_id'];
    },
    Array<ConfiguredRole>
  >(),

  add: rpcMethodTypeContainer<
    {
      server_id: ConfiguredRole['server_id'];
      name: ConfiguredRole['name'];
      password: string;
    },
    ConfiguredRole
  >(),

  delete: rpcMethodTypeContainer<
    {
      configured_role_id: ConfiguredRole['id'];
    },
    void
  >(),

  set_password: rpcMethodTypeContainer<
    {
      configured_role_id: ConfiguredRole['id'];
      password: string;
    },
    void
  >(),
};
