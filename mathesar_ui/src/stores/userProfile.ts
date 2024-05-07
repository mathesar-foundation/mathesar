import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

import type { User } from '@mathesar/api/rest/users';

import { UserModel } from './users';

const contextKey = Symbol('UserProfileStore');

export type UserProfileStore = Writable<UserModel>;

export function getUserProfileStoreFromContext(): UserProfileStore | undefined {
  return getContext<UserProfileStore>(contextKey);
}

export function setUserProfileStoreInContext(
  user: User | UserModel,
): UserProfileStore {
  if (getUserProfileStoreFromContext() !== undefined) {
    throw Error('User profile store context has already been set');
  }
  const userProfileStore: UserProfileStore = writable(
    user instanceof UserModel ? user : new UserModel(user),
  );
  setContext(contextKey, userProfileStore);
  return userProfileStore;
}
