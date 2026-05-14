import type { User } from '@mathesar/api/rpc/users';
import type { Collaborator } from '@mathesar/models/Collaborator';
import type { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
import type { Database } from '@mathesar/models/Database';

import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('collaboration features context store');

export class CollaborationFeaturesContext {
  database;

  collaborators;

  constructor(database: Database) {
    this.database = database;
    this.collaborators = this.database.constructCollaboratorsStore();
  }

  async addCollaborator(
    userId: User['id'],
    configuredRoleId: ConfiguredRole['id'],
  ) {
    const newCollaborator = await this.database.addCollaborator(
      userId,
      configuredRoleId,
    );
    this.collaborators.updateResolvedValue((collaborators) =>
      collaborators.with(newCollaborator.id, newCollaborator),
    );
    return newCollaborator;
  }

  async deleteCollaborator(collaborator: Collaborator) {
    await collaborator.delete();
    this.collaborators.updateResolvedValue((c) => c.without(collaborator.id));
  }

  static construct(database: Database) {
    return setRouteContext(
      contextKey,
      new CollaborationFeaturesContext(database),
    );
  }

  static get() {
    return getRouteContext<CollaborationFeaturesContext>(contextKey);
  }
}
