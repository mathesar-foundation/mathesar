import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export const sampleDataOptions = [
  'library_management',
  'movie_collection',
] as const;

export type SampleDataSchemaIdentifier = (typeof sampleDataOptions)[number];

export interface Connection {
  id: number;
  nickname: string;
  database: string;
  username: string;
  host: string;
  port: number;
}

export const connections = {
  add_from_known_connection: rpcMethodTypeContainer<
    {
      nickname: Connection['nickname'];
      database: Connection['database'];
      /** When true, create a new database if needed. Defaults to False. */
      create_db?: boolean;
      /**
       * When present, reuse the credentials from a known connection. When
       * omitted, use the credentials from the internal DB server.
       */
      connection_id?: Connection['id'];
      /** Sample data to load. Defaults to none. */
      sample_data?: SampleDataSchemaIdentifier[];
    },
    Connection
  >(),

  add_from_scratch: rpcMethodTypeContainer<
    {
      nickname: Connection['nickname'];
      database: Connection['database'];
      user: Connection['username'];
      password: string;
      host: Connection['host'];
      port: Connection['port'];
      /** Sample data to load. Defaults to none. */
      sample_data?: SampleDataSchemaIdentifier[];
    },
    Connection
  >(),
};
