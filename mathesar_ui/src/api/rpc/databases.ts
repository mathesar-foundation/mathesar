import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawServer } from './servers';

export interface RawDatabase {
  id: number;
  name: string;
  server_id: RawServer['id'];
}

export const databases = {
  list: rpcMethodTypeContainer<
    {
      server_id?: RawDatabase['server_id'];
    },
    Array<RawDatabase>
  >(),
};
