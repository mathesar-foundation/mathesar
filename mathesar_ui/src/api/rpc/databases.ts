import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawConfiguredRole } from './roles';
import type { RawServer } from './servers';

export interface RawDatabase {
  id: number;
  name: string;
  server_id: RawServer['id'];
}

export const sampleDataOptions = [
  'library_management',
  'movie_collection',
] as const;

export type SampleDataSchemaIdentifier = (typeof sampleDataOptions)[number];

export interface DatabaseConnectionResult {
  server: RawServer;
  database: RawDatabase;
  configured_role: RawConfiguredRole;
}

export const databases = {
  configured: {
    list: rpcMethodTypeContainer<
      {
        server_id?: RawDatabase['server_id'];
      },
      Array<RawDatabase>
    >(),
  },
  setup: {
    create_new: rpcMethodTypeContainer<
      {
        database: RawDatabase['name'];
        sample_data?: SampleDataSchemaIdentifier[];
      },
      DatabaseConnectionResult
    >(),
    connect_existing: rpcMethodTypeContainer<
      {
        host: RawServer['host'];
        port: RawServer['port'];
        database: RawDatabase['name'];
        role: RawConfiguredRole['name'];
        password: string;
        sample_data?: SampleDataSchemaIdentifier[];
      },
      DatabaseConnectionResult
    >(),
  },
};
