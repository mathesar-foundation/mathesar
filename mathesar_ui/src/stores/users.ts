import { setContext, getContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';
import UserApi, { type User, type UnsavedUser } from '@mathesar/api/users';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';

const contextKey = Symbol('users list store');

interface UserListStore {
  requestStatus: Readable<RequestStatus | undefined>;
  users: Readable<User[]>;
  count: Readable<number>;
  fetchUsers: () => Promise<void>;
}

export class UsersList implements UserListStore {
  requestStatus: Writable<RequestStatus | undefined> = writable();

  users: Writable<User[]> = writable([]);

  count: Writable<number> = writable(0);

  constructor() {
    void this.fetchUsers();
  }

  async fetchUsers() {
    try {
      this.requestStatus.set({
        state: 'processing',
      });
      const response = await UserApi.list();
      this.users.set(response.results);
      this.count.set(response.count);
      this.requestStatus.set({
        state: 'success',
      });
    } catch (e) {
      this.requestStatus.set({
        state: 'failure',
        errors: [getErrorMessage(e)],
      });
    }
  }
}

export function getUsersStoreFromContext():
  | Readable<UserListStore>
  | undefined {
  return getContext<Readable<UserListStore>>(contextKey);
}

export function setUsersStoreContext(): void {
  if (getUsersStoreFromContext() !== undefined) {
    throw Error('User profile store context has already been set');
  }
  setContext(contextKey, writable(new UsersList()));
}
