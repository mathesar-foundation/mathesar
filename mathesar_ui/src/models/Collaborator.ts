import type { RawCollaborator } from '@mathesar/api/rpc/collaborators';

import type { Database } from './Database';

export class Collaborator {
  readonly id;

  readonly user_id;

  readonly configured_role_id;

  readonly database;

  constructor(props: {
    database: Database;
    rawCollaborator: RawCollaborator;
  }) {
    this.id = props.rawCollaborator.id;
    this.user_id = props.rawCollaborator.user_id;
    this.configured_role_id = props.rawCollaborator.configured_role_id;
    this.database = props.database;
  }
}
