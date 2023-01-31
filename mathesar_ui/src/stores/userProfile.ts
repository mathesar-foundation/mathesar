import { setContext, getContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';
import UserApi, { type User, type UnsavedUser } from '@mathesar/api/users';

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
    //
  }

  getDisplayName(): string {
    if (this.short_name) {
      return this.short_name;
    }
    return this.username;
  }

  /** @throws Error if unable to save */
  async update(
    userDetails: Partial<Omit<UnsavedUser, 'password'>>,
  ): Promise<UserProfile> {
    await UserApi.update(this.id, userDetails);
    const updatedUserProfile = new UserProfile({
      ...this,
      ...userDetails,
    });
    const userProfileStore = getContext<Writable<UserProfile> | undefined>(
      contextKey,
    );
    if (userProfileStore) {
      userProfileStore.set(updatedUserProfile);
    }
    return updatedUserProfile;
  }
}

export function getUserProfileStoreFromContext():
  | Readable<UserProfile>
  | undefined {
  return getContext<Readable<UserProfile>>(contextKey);
}

export function setUserProfileStoreContext(userDetails: User): void {
  if (getUserProfileStoreFromContext() !== undefined) {
    throw Error('User profile store context has already been set');
  }
  setContext(contextKey, writable(new UserProfile(userDetails)));
}
