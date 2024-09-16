import type { RawSchema, SchemaPrivilege } from '@mathesar/api/rpc/schemas';

import type { Database } from './Database';

export class Schema {
  readonly oid: number;

  readonly name: string;

  readonly description: string;

  table_count: number;

  readonly owner_oid: number;

  readonly current_role_priv: SchemaPrivilege[];

  readonly current_role_owns: boolean;

  readonly database: Database;

  constructor(props: { database: Database; rawSchema: RawSchema }) {
    this.oid = props.rawSchema.oid;
    this.name = props.rawSchema.name;
    this.description = props.rawSchema.description;
    this.table_count = props.rawSchema.table_count;
    this.owner_oid = props.rawSchema.owner_oid;
    this.current_role_priv = props.rawSchema.current_role_priv;
    this.current_role_owns = props.rawSchema.current_role_owns;
    this.database = props.database;
  }
}
