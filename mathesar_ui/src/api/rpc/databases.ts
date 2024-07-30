import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { Server } from './servers';

export interface DatabaseResponse {
  id: number;
  name: string;
  server_id: Server['id'];
}

export interface Database extends DatabaseResponse {
  server_host: Server['host'];
  server_port: Server['port'];
}

export const databases = {
  list: rpcMethodTypeContainer<
    {
      server_id?: DatabaseResponse['server_id'];
    },
    Array<DatabaseResponse>
  >(),
};
