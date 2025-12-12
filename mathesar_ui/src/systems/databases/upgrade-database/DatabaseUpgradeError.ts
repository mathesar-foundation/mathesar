import type { Database } from '@mathesar/models/Database';

export default class DatabaseUpgradeError extends Error {
  database: Database;

  constructor(database: Database, message: string) {
    super(message);
    this.database = database;
  }
}
