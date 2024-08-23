import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

import type { RawConfiguredRole } from './configured_roles';
import type { RawDatabase } from './databases';
import type { RawServer } from './servers';

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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const database_setup = {
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
};
