import type { RawConfiguredRole } from '@mathesar/api/rpc/configured_roles';

import type { Database } from './Database';

export class ConfiguredRole {
  readonly id: number;

  readonly name: string;

  readonly database: Database;

  constructor(props: {
    database: Database;
    rawConfiguredRole: RawConfiguredRole;
  }) {
    this.id = props.rawConfiguredRole.id;
    this.name = props.rawConfiguredRole.name;
    this.database = props.database;
  }
}
