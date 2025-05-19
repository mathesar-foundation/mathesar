import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface RawServer {
  id: number;
  host: string;
  port: number | null;
}

export const servers = {
  configured: {
    list: rpcMethodTypeContainer<void, Array<RawServer>>(),
    patch: rpcMethodTypeContainer<
      {
        server_id: RawServer['id'];
        patch: {
          host?: string;
          port?: number | null;
        };
      },
      Array<RawServer>
    >(),
  },
};
