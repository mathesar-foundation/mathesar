import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawDatabase } from './databases';
import type { RawConfiguredRole } from './roles';
import type { User } from './users';

export interface RawCollaborator {
  id: number;
  user_id: number;
  database_id: RawDatabase['id'];
  configured_role_id: RawConfiguredRole['id'];
  user_info: User;
}

export const collaborators = {
  list: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    Array<RawCollaborator>
  >(),
  add: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
      user_id: number;
      configured_role_id: RawConfiguredRole['id'];
    },
    RawCollaborator
  >(),
  set_role: rpcMethodTypeContainer<
    {
      collaborator_id: RawCollaborator['id'];
      configured_role_id: RawConfiguredRole['id'];
    },
    RawCollaborator
  >(),
  delete: rpcMethodTypeContainer<
    {
      collaborator_id: RawCollaborator['id'];
    },
    void
  >(),
};
