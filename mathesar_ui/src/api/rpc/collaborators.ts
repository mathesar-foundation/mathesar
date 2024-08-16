import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawConfiguredRole } from './configured_roles';
import type { RawDatabase } from './databases';

export interface RawCollaborator {
  id: number;
  user_id: number;
  database_id: RawDatabase['id'];
  configured_role_id: RawConfiguredRole['id'];
}

export const collaborators = {
  list: rpcMethodTypeContainer<
    {
      database_id: RawDatabase['id'];
    },
    Array<RawCollaborator>
  >(),
};
