import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Server } from './servers';

export interface Database {
  id: number;
  name: string;
  server_id: Server['id'];
}

export const databases = {
  list: rpcMethodTypeContainer<
    {
      server_id?: Database['server_id'];
    },
    Array<Database>
  >(),
};
