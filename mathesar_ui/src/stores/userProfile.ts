/* eslint-disable max-classes-per-file */

import { setContext, getContext } from 'svelte';
import {
  get,
  writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Writable,
} from 'svelte/store';
import type { User, UnsavedUser } from '@mathesar/api/users';

const contextKey = Symbol('userprofile store');

export class UserProfile implements Readonly<User> {
  readonly id;

  readonly is_superuser;

  readonly database_roles;

  readonly schema_roles;

  readonly full_name;

  readonly short_name;

  readonly email;

  readonly username;

  constructor(userDetails: User) {
    this.id = userDetails.id;
    this.is_superuser = userDetails.is_superuser;
    this.database_roles = userDetails.database_roles;
    this.schema_roles = userDetails.schema_roles;
    this.full_name = userDetails.full_name;
    this.short_name = userDetails.short_name;
    this.email = userDetails.email;
    this.username = userDetails.username;
  }

  hasPermission() {
    // To be implemented
  }

  getDisplayName(): string {
    if (this.short_name) {
      return this.short_name;
    }
    return this.username;
  }

  with(userDetails: Partial<Omit<UnsavedUser, 'password'>>): UserProfile {
    return new UserProfile({
      ...this,
      ...userDetails,
    });
  }
}

export class UserProfileStore implements Writable<UserProfile> {
  store: Writable<UserProfile>;

  constructor(userProfile: UserProfile) {
    this.store = writable(userProfile);
  }

  set(value: UserProfile): void {
    this.store.set(value);
  }

  update(updater: Updater<UserProfile>): void {
    this.store.update(updater);
  }

  subscribe(run: Subscriber<UserProfile>): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): UserProfile {
    return get(this.store);
  }
}

/* eslint-enable max-classes-per-file */

export function getUserProfileStoreFromContext(): UserProfileStore | undefined {
  return getContext<UserProfileStore>(contextKey);
}

export function setUserProfileStoreContext(userDetails: User): void {
  if (getUserProfileStoreFromContext() !== undefined) {
    throw Error('User profile store context has already been set');
  }
  setContext(contextKey, new UserProfileStore(new UserProfile(userDetails)));
}
