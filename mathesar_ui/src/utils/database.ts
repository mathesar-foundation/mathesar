import type {
  Database,
  SuccessfullyConnectedDatabase,
} from '@mathesar/AppTypes';

export const isSuccessfullyConnectedDatabase = (
  database: Database,
): database is SuccessfullyConnectedDatabase => !('error' in database);
