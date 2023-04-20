import type { UserRole } from '@mathesar/api/users';
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
  | 'canEditPermissions';

const operationsForEditor: Set<AccessOperation> = new Set([
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
      return false;
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
      return 'Manager';
    case 'editor':
      return 'Editor';
    case 'viewer':
      return 'Viewer';
    default:
      throw new MissingExhaustiveConditionError(userRole);
  }
}

export function getDescriptionForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'manager':
      return 'Manager Access';
    case 'editor':
      return 'Editor Access';
    case 'viewer':
      return 'Read-Only Access';
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
