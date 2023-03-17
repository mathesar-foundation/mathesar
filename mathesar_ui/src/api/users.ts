import type { Database, SchemaEntry } from '@mathesar/AppTypes';
import {
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
  type PaginatedResponse,
} from './utils/requestUtils';

export interface UnsavedUser {
  full_name: string | null;
  email: string | null;
  username: string;
  password: string;
}

export type UserRole = 'viewer' | 'editor' | 'manager';

export interface DatabaseRole {
  id: number;
  database: Database['id'];
  role: UserRole;
}

export interface SchemaRole {
  id: number;
  schema: SchemaEntry['id'];
  role: UserRole;
}

export interface User extends Omit<UnsavedUser, 'password'> {
  readonly id: number;
  readonly is_superuser: boolean;
  readonly database_roles: DatabaseRole[];
  readonly schema_roles: SchemaRole[];
}

function list() {
  return getAPI<PaginatedResponse<User>>('/api/ui/v0/users/');
}

function get(userId: User['id']) {
  return getAPI<User>(`/api/ui/v0/users/${userId}/`);
}

function add(user: UnsavedUser) {
  return postAPI<User>('/api/ui/v0/users/', user);
}

function deleteUser(userId: User['id']) {
  return deleteAPI(`/api/ui/v0/users/${userId}/`);
}

function update(
  userId: User['id'],
  properties: Partial<Omit<UnsavedUser, 'password'>>,
) {
  return patchAPI(`/api/ui/v0/users/${userId}/`, properties);
}

function changePassword(old_password: string, password: string) {
  return postAPI('/api/ui/v0/users/password_change/', {
    password,
    old_password,
  });
}

function resetPassword(userId: User['id'], password: string) {
  return postAPI(`/api/ui/v0/users/${userId}/password_reset/`, {
    password,
  });
}

function addDatabaseRole(
  userId: User['id'],
  databaseId: Database['id'],
  role: UserRole,
) {
  return postAPI<DatabaseRole>('/api/ui/v0/database_roles/', {
    user: userId,
    database: databaseId,
    role,
  });
}

function deleteDatabaseRole(roleId: DatabaseRole['id']) {
  return deleteAPI(`/api/ui/v0/database_roles/${roleId}/`);
}

function addSchemaRole(
  userId: User['id'],
  schemaId: SchemaEntry['id'],
  role: UserRole,
) {
  return postAPI<SchemaRole>('/api/ui/v0/schema_roles/', {
    user: userId,
    schema: schemaId,
    role,
  });
}

function deleteSchemaRole(roleId: SchemaRole['id']) {
  return deleteAPI(`/api/ui/v0/schema_roles/${roleId}/`);
}

export default {
  list,
  get,
  add,
  delete: deleteUser,
  update,
  changePassword,
  resetPassword,
  addDatabaseRole,
  deleteDatabaseRole,
  addSchemaRole,
  deleteSchemaRole,
};
