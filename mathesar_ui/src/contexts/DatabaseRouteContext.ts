import type { Database } from '@mathesar/models/Database';
import type { Role } from '@mathesar/models/Role';

import type { CollaborationFeaturesContext } from './CollaborationFeaturesContext';
import { getRouteContext, setRouteContext } from './utils';

const contextKey = Symbol('database route store');

export class DatabaseRouteContext {
  database;

  roles;

  underlyingDatabase;

  currentRole;

  collaborationFeaturesContext;

  constructor(
    database: Database,
    collaborationFeaturesContext: CollaborationFeaturesContext,
  ) {
    this.database = database;
    this.collaborationFeaturesContext = collaborationFeaturesContext;
    this.roles = database.constructRolesStore();
    this.underlyingDatabase = database.constructUnderlyingDatabaseStore();
    this.currentRole = database.constructCurrentRoleStore();
  }

  /**
   * TODO: Discuss if actions need to be on the contexts which belong
   * to the routes where the user performs the actions, or if they should
   * be on the context where the store is present.
   *
   * i.e. should we have `addRole` and `deleteRole` here or in
   * DatabaseSettingsRouteContext?
   */
  async addRole(
    props:
      | {
          roleName: Role['name'];
          login: false;
          password?: never;
        }
      | { roleName: Role['name']; login: true; password: string },
  ) {
    const newRole = await this.database.addRole(
      props.roleName,
      props.login,
      props.password,
    );
    this.roles.updateResolvedValue((r) => r.with(newRole.oid, newRole));
  }

  async deleteRole(role: Role) {
    await role.delete();
    this.roles.updateResolvedValue((r) => r.without(role.oid));
  }

  static construct(
    database: Database,
    collaborationFeaturesContext: CollaborationFeaturesContext,
  ) {
    return setRouteContext(
      contextKey,
      new DatabaseRouteContext(database, collaborationFeaturesContext),
    );
  }

  static get() {
    return getRouteContext<DatabaseRouteContext>(contextKey);
  }
}
