import type { UserRole } from '@mathesar/api/users';
import { MissingExhaustiveConditionError } from '@mathesar/utils/errors';

export type AccessOperation = 'modifyData' | 'performCrud' | 'modifyAccess';

export function roleAllowsOperation(
  userRole: UserRole,
  operation: AccessOperation,
): boolean {
  switch (userRole) {
    case 'manager':
      return true;
    case 'editor':
      return operation === 'modifyData';
    case 'viewer':
      return false;
    default:
      throw new MissingExhaustiveConditionError(userRole);
  }
}
