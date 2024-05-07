import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import type { UserRole } from '@mathesar/api/rest/users';
import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

/**
 * - `canEditTableRecords`: DML operations on table rows and cells.
 * - `canEditMetadata`: CRUD operations on data stored on our internal database.
 *   - This includes column display options, record summary etc.,
 *   - This also includes all operations on Explorations.
 * - `canExecuteDDL`: DDL operations on objects stored directly on user database,
 *   including schemas, tables, columns, links, constraints etc.,
 *   This also includes:
 *    - Descriptions for schemas and tables: Because these are stored
 *    in the user database.
 *    - Importing data: Because this creates a new table.
 * - `editPermissions`: Changes to user access.
 */
export type AccessOperation =
  | 'canEditTableRecords'
  | 'canEditMetadata'
  | 'canExecuteDDL'
  | 'canEditPermissions'
  | 'canViewLinkedEntities';

const operationsForViewer: Set<AccessOperation> = new Set([
  'canViewLinkedEntities',
]);

const operationsForEditor: Set<AccessOperation> = new Set([
  ...operationsForViewer,
  'canEditTableRecords',
  'canEditMetadata',
]);

export function roleAllowsOperation(
  userRole: UserRole,
  operation: AccessOperation,
): boolean {
  switch (userRole) {
    case 'manager':
      return true;
    case 'editor':
      return operationsForEditor.has(operation);
    case 'viewer':
      return operationsForViewer.has(operation);
    default:
      throw new MissingExhaustiveConditionError(userRole);
  }
}

export function rolesAllowOperation(
  accessOperation: AccessOperation,
  roles: UserRole[],
): boolean {
  return roles.some((role) => roleAllowsOperation(role, accessOperation));
}

export function getDisplayNameForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'manager':
      return get(_)('manager');
    case 'editor':
      return get(_)('editor');
    case 'viewer':
      return get(_)('viewer');
    default:
      throw new MissingExhaustiveConditionError(userRole);
  }
}

export function getDescriptionForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'manager':
      return get(_)('manager_access');
    case 'editor':
      return get(_)('editor_access');
    case 'viewer':
      return get(_)('readonly_access');
    default:
      throw new MissingExhaustiveConditionError(userRole);
  }
}

export type AccessControlObject = 'database' | 'schema';

export type ObjectRoleMap = Map<AccessControlObject, UserRole>;

/**
 * Orders roles for numerical comparison. Highest number means higher
 * access levels.
 */
const userRoleToLevelInInteger = {
  viewer: 1,
  editor: 2,
  manager: 3,
};

export function getObjectWithHighestPrecedenceByRoles(
  objectRoleMap: ObjectRoleMap,
): AccessControlObject {
  const schemaRole = objectRoleMap.get('schema');
  const databaseRole = objectRoleMap.get('database');
  if (schemaRole && databaseRole) {
    if (
      userRoleToLevelInInteger[schemaRole] >
      userRoleToLevelInInteger[databaseRole]
    ) {
      return 'schema';
    }
    return 'database';
  }
  if (schemaRole) {
    return 'schema';
  }
  if (databaseRole) {
    return 'database';
  }
  // Defaults to database when both roles are undefined
  return 'database';
}
