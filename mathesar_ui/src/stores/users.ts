import { setContext, getContext } from 'svelte';
import { get, writable, type Readable, type Writable } from 'svelte/store';
import userApi, { type User } from '@mathesar/api/users';
import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';

const contextKey = Symbol('users list store');

export interface UsersStore {
  requestStatus: Readable<RequestStatus | undefined>;
  users: Readable<User[]>;
  count: Readable<number>;
  fetchUsers: () => Promise<void>;
  getUserDetails: (userId: number) => Promise<User | undefined>;
}

/**
 * This class is separate from the interface so that we can leverage TS to
 * enforce compile-time checks which ensure some properties are publicly
 * readable while privately writable.
 */
class WritableUsersStore implements UsersStore {
  readonly requestStatus: Writable<RequestStatus | undefined> = writable();

  readonly users = writable<User[]>([]);

  readonly count = writable(0);

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

export function getUsersStoreFromContext(): UsersStore | undefined {
  return getContext<UsersStore>(contextKey);
}

export function setUsersStoreInContext(): void {
  if (getUsersStoreFromContext() !== undefined) {
    throw Error('UsersStore context has already been set');
  }
  setContext(contextKey, new WritableUsersStore());
}
