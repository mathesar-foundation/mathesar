import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface Server {
  id: number;
  host: string;
  port: number;
}

export const servers = {
  list: rpcMethodTypeContainer<void, Array<Server>>(),
};
