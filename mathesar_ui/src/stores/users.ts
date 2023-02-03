import { setContext, getContext } from 'svelte';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import userApi, { type User } from '@mathesar/api/users';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';

const contextKey = Symbol('users list store');

interface UserListStore {
  requestStatus: Readable<RequestStatus | undefined>;
  users: Readable<User[]>;
  count: Readable<number>;
  fetchUsers: () => Promise<void>;
  getUserDetails: (userId: number) => Promise<User | undefined>;
}

export class UsersList implements UserListStore {
  readonly requestStatus: Writable<RequestStatus | undefined> = writable();

  readonly users: Writable<User[]> = writable([]);

  readonly count: Writable<number> = writable(0);

  request: ReturnType<typeof userApi.list> | undefined;

  constructor() {
    void this.fetchUsers();
  }

  async fetchUsers() {
    try {
      this.requestStatus.set({
        state: 'processing',
      });
      this.request = userApi.list();
      const response = await this.request;
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

  async getUserDetails(userId: number) {
    const requestStatus = get(this.requestStatus);
    if (requestStatus?.state === 'success') {
      return get(this.users).find((user) => user.id === userId);
    }
    if (requestStatus?.state === 'processing') {
      const result = await this.request;
      return result?.results.find((user) => user.id === userId);
    }
    return undefined;
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
