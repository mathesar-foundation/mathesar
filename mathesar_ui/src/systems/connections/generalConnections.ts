import { map } from 'iter-tools';
import { derived, type Readable } from 'svelte/store';

import type {
  Connection,
  ConnectionReference,
} from '@mathesar/api/rest/connections';
import { connectionsStore } from '@mathesar/stores/databases';
import {
  preloadCommonData,
  type CommonData,
} from '@mathesar/utils/preloadData';

interface UserDatabaseConnection {
  type: 'user_database';
  connection: Connection;
}
interface InternalDatabaseConnection {
  type: 'internal_database';
  connection: CommonData['internal_db_connection'];
}

export type GeneralConnection =
  | UserDatabaseConnection
  | InternalDatabaseConnection;

function isUserDatabaseConnection(
  connection: GeneralConnection,
): connection is UserDatabaseConnection {
  return connection.type === 'user_database';
}

function getCommonDataGeneralConnections(): GeneralConnection[] {
  const commonData = preloadCommonData();
  if (!commonData) return [];
  return [
    {
      type: 'internal_database',
      connection: commonData.internal_db_connection,
    },
  ];
}

export const generalConnections: Readable<GeneralConnection[]> = derived(
  connectionsStore.connections,
  (connections) => [
    ...getCommonDataGeneralConnections(),
    ...map(
      ([, connection]) => ({ type: 'user_database' as const, connection }),
      connections,
    ),
  ],
);

export function pickDefaultGeneralConnection(connections: GeneralConnection[]) {
  if (connections.length === 0) return undefined;
  const internalConnection = connections.find(
    (connection) => connection.type === 'internal_database',
  );
  if (internalConnection) return internalConnection;
  return connections
    .filter(isUserDatabaseConnection)
    .reduce((a, b) => (a.connection.id > b.connection.id ? a : b));
}

export function getUsername({ connection }: GeneralConnection): string {
  return 'user' in connection ? connection.user : connection.username;
}

export function getConnectionReference(
  connection: GeneralConnection,
): ConnectionReference {
  return connection.type === 'internal_database'
    ? { connection_type: 'internal_database' }
    : { connection_type: 'user_database', id: connection.connection.id };
}
