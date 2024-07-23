import type { Language } from '@mathesar/i18n/languages/utils';

import {
  type PaginatedResponse,
  deleteAPI,
  getAPI,
  patchAPI,
  postAPI,
} from './utils/requestUtils';

export interface UnsavedUser {
  full_name: string | null;
  email: string | null;
  username: string;
  password: string;
  display_language: Language;
}

export interface User extends Omit<UnsavedUser, 'password'> {
  readonly id: number;
  readonly is_superuser: boolean;
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

export default {
  list,
  get,
  add,
  delete: deleteUser,
  update,
  changePassword,
  resetPassword,
};
