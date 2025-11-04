import type { User } from '@mathesar/api/rpc/users';

export type UserDisplayField = 'full_name' | 'email' | 'username';

/**
 * Get a display label for a user based on the specified display field.
 *
 * @param user - The user object
 * @param displayField - Which field to display ('full_name', 'email', or 'username')
 * @returns The formatted user label, or the user ID as a string if the field is empty
 *
 * @example
 * ```ts
 * const label = getUserLabel(user, 'full_name');
 * // Returns "John Doe" if full_name exists, otherwise "123" (user.id)
 * ```
 */
export function getUserLabel(
  user: User,
  displayField: UserDisplayField = 'full_name',
): string {
  // Access the property directly by name, fall back to ID if empty
  const fieldValue = user[displayField];
  // Check for null, undefined, empty string, or the string "null"/"undefined"
  if (
    fieldValue &&
    fieldValue !== 'null' &&
    fieldValue !== 'undefined' &&
    typeof fieldValue === 'string' &&
    fieldValue.trim() !== ''
  ) {
    return fieldValue;
  }
  return String(user.id);
}
