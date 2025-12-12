import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export const sslModeOptions = ['prefer', 'require', 'disable'] as const;

export type SslMode = (typeof sslModeOptions)[number];

export interface RawServer {
  id: number;
  host: string;
  port: number | null;
  sslmode: SslMode;
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
          sslmode?: SslMode;
        };
      },
      Array<RawServer>
    >(),
  },
};
