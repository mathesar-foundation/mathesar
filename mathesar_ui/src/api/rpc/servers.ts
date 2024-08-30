import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface RawServer {
  id: number;
  host: string;
  port: number;
}

export const servers = {
  configured: {
    list: rpcMethodTypeContainer<void, Array<RawServer>>(),
  },
};
