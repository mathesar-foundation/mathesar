import type { Database, SchemaEntry } from '@mathesar/AppTypes';

export interface UnsavedUser {
  full_name: string | null;
  short_name: string | null;
  email: string | null;
  username: string;
  password: string;
}

export type UserRole = 'viewer' | 'editor' | 'manager';

export interface DatabaseRole {
  database: Database['id'];
  role: UserRole;
}

export interface SchemaRole {
  schema: SchemaEntry['id'];
  role: UserRole;
}

export interface User extends Omit<UnsavedUser, 'password'> {
  readonly id: number;
  readonly is_superuser: boolean;
  readonly database_roles: DatabaseRole[];
  readonly schema_roles: [];
}

function list() {}

function get(userId: User['id']) {}

function add(user: UnsavedUser) {}

function deleteUser(userId: User['id']) {}

function update(
  userId: User['id'],
  properties: Partial<Omit<UnsavedUser, 'password'>>,
) {}

function changePassword(userId: User['id'], password: string) {}

function resetPassword(userId: User['id'], password: string) {}

export default {
  list,
  get,
  add,
  delete: deleteUser,
  update,
  changePassword,
  resetPassword,
};
