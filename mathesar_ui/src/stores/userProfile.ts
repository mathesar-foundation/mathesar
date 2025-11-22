import { getContext, setContext } from 'svelte';
import { type Writable, writable } from 'svelte/store';

import type { User } from '@mathesar/api/rpc/users';

import { UserModel } from './users';

const contextKey = Symbol('UserProfileStore');

export type UserProfileStore = Writable<UserModel>;

export function getUserProfileStoreFromContext(): UserProfileStore {
  const userProfileStore = getContext<UserProfileStore | undefined>(contextKey);
  if (!userProfileStore) {
    throw Error('User profile store context not found');
  }
  return userProfileStore;
}

export function setUserProfileStoreInContext(
  user: User | UserModel,
): UserProfileStore {
  const existingStore = getContext<UserProfileStore | undefined>(contextKey);
  if (existingStore) {
    throw Error('User profile store context has already been set');
  }
  const userProfileStore: UserProfileStore = writable(
    user instanceof UserModel ? user : new UserModel(user),
  );
  setContext(contextKey, userProfileStore);
  return userProfileStore;
}
