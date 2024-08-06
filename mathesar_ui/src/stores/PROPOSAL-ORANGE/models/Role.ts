import type { RawRole } from './apiTypes';
import type { Database } from './Database';

export class Role {
  oid: number;

  name: string;

  // Even though they technically belong under a PostgreSQL server, they do not
  // belong under a django "Server" object. Role is not a Django object.
  // Roles require a database id inorder to be queried.
  database: Database;

  constructor(p: { database: Database; rawRole: RawRole }) {
    this.oid = p.rawRole.oid;
    this.name = p.rawRole.name;
    this.database = p.database;
  }

  configureInMathesar() {
    throw new Error('Not Implemented yet');
  }
}
