import type { RawRole, RawRoleMember } from '@mathesar/api/rpc/roles';

import type { Database } from './Database';

export class Role {
  readonly oid: number;

  readonly name: string;

  readonly super: boolean;

  readonly inherits: boolean;

  readonly createRole: boolean;

  readonly createDb: boolean;

  readonly login: boolean;

  readonly description?: string;

  readonly members?: RawRoleMember[];

  readonly database: Database;

  constructor(props: { database: Database; rawRole: RawRole }) {
    this.oid = props.rawRole.oid;
    this.name = props.rawRole.name;
    this.super = props.rawRole.super;
    this.inherits = props.rawRole.inherits;
    this.createRole = props.rawRole.create_role;
    this.createDb = props.rawRole.create_db;
    this.login = props.rawRole.login;
    this.description = props.rawRole.description;
    this.members = props.rawRole.members;
    this.database = props.database;
  }
}
