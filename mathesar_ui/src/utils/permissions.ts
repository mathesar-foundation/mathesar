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
