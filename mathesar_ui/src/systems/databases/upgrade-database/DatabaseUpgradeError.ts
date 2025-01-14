import type { Database } from '@mathesar/models/Database';

export default class DatabaseUpgradeError extends Error {
  database: Pick<Database, 'id' | 'name'>;

  constructor(database: Pick<Database, 'id' | 'name'>, message: string) {
    super(message);
    this.database = database;
  }
}
