import type { UserRole } from '@mathesar/api/users';
import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

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
