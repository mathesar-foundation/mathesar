/* eslint-disable max-classes-per-file */

import { getContext, setContext } from 'svelte';
import { type Writable, get, writable } from 'svelte/store';

import userApi, { type UnsavedUser, type User } from '@mathesar/api/rest/users';
import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
import { getErrorMessage } from '@mathesar/utils/errors';
import type { MakeWritablePropertiesReadable } from '@mathesar/utils/typeUtils';

export class UserModel {
  readonly id: User['id'];

  readonly isMathesarAdmin: User['is_superuser'];

  readonly fullName: User['full_name'];

  readonly email: User['email'];

  readonly username: User['username'];

  readonly displayLanguage: User['display_language'];

  constructor(userDetails: User) {
    this.id = userDetails.id;
    this.isMathesarAdmin = userDetails.is_superuser;
    this.fullName = userDetails.full_name;
    this.email = userDetails.email;
    this.username = userDetails.username;
    this.displayLanguage = userDetails.display_language;
  }

  getDisplayName(): string {
    return this.username;
  }

  getUser(): User {
    return {
      id: this.id,
      is_superuser: this.isMathesarAdmin,
      username: this.username,
      full_name: this.fullName,
      email: this.email,
      display_language: this.displayLanguage,
    };
  }

  with(userDetails: Partial<Omit<UnsavedUser, 'password'>>): UserModel {
    return new UserModel({
      ...this.getUser(),
      ...userDetails,
    });
  }
}

export class AnonymousViewerUserModel extends UserModel {
  constructor() {
    super({
      id: 0,
      is_superuser: false,
      username: 'Anonymous',
      full_name: 'Anonymous',
      email: null,
      display_language: 'en',
    });
  }
}

const contextKey = Symbol('users list store');

class WritableUsersStore {
  readonly requestStatus: Writable<RequestStatus | undefined> = writable();

  readonly users = writable<UserModel[]>([]);

  readonly count = writable(0);

  private request: ReturnType<typeof userApi.list> | undefined;

  constructor() {
    void this.fetchUsers();
  }

  /**
   * @throws Error
   */
  private async fetchUsersSilently() {
    this.request?.cancel();
    this.request = userApi.list();
    const response = await this.request;
    this.users.set(response.results.map((user) => new UserModel(user)));
    this.count.set(response.count);
  }

  async fetchUsers() {
    try {
      this.requestStatus.set({
        state: 'processing',
      });
      await this.fetchUsersSilently();
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
      const user = result?.results.find((entry) => entry.id === userId);
      if (user) {
        return new UserModel(user);
      }
    }
    return undefined;
  }

  async delete(userId: number) {
    this.requestStatus.set({
      state: 'processing',
    });
    await userApi.delete(userId);
    this.users.update((users) => users.filter((user) => user.id !== userId));
    this.count.update((count) => count - 1);
    this.requestStatus.set({
      state: 'success',
    });
    // Re-fetching the users isn't strictly necessary, but we do it anyway
    // since it's a good opportunity to ensure the UI is up-to-date.
    void this.fetchUsersSilently();
  }
}

export type UsersStore = MakeWritablePropertiesReadable<WritableUsersStore>;

export function getUsersStoreFromContext(): UsersStore | undefined {
  return getContext<WritableUsersStore>(contextKey);
}

export function setUsersStoreInContext(): UsersStore {
  if (getUsersStoreFromContext() !== undefined) {
    throw Error('UsersStore context has already been set');
  }
  const usersStore = new WritableUsersStore();
  setContext(contextKey, usersStore);
  return usersStore;
}

/* eslint-enable max-classes-per-file */
