import type { Language } from '@mathesar/i18n/languages/utils';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

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

export const users = {
  list: rpcMethodTypeContainer<void, User[]>(),

  get: rpcMethodTypeContainer<{ user_id: User['id'] }, User>(),

  add: rpcMethodTypeContainer<{ user_def: UnsavedUser }, User>(),

  delete: rpcMethodTypeContainer<{ user_id: User['id'] }, void>(),

  patch: rpcMethodTypeContainer<
    {
      user_id: User['id'];
      user_info: Partial<Omit<UnsavedUser, 'password'>>;
    },
    User
  >(),

  password: {
    replace_own: rpcMethodTypeContainer<
      {
        user_id: User['id'];
        old_password: string;
        new_password: string;
      },
      void
    >(),

    revoke: rpcMethodTypeContainer<
      {
        user_id: User['id'];
        new_password: string;
      },
      void
    >(),
  },
};
