import type { Language } from '@mathesar/i18n/languages/utils';
import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';

export interface BaseUser {
  readonly full_name: string | null;
  readonly email: string | null;
  readonly username: string;
  readonly display_language: Language;
}

interface UserDef extends BaseUser {
  readonly password: string;
  readonly is_superuser: boolean;
}

export interface User extends BaseUser {
  readonly id: number;
  readonly is_superuser: boolean;
}

export const users = {
  list: rpcMethodTypeContainer<void, User[]>(),

  get: rpcMethodTypeContainer<{ user_id: User['id'] }, User>(),

  add: rpcMethodTypeContainer<{ user_def: UserDef }, User>(),

  delete: rpcMethodTypeContainer<{ user_id: User['id'] }, void>(),

  patch_self: rpcMethodTypeContainer<BaseUser, User>(),

  patch_other: rpcMethodTypeContainer<
    Partial<Omit<User, 'id'>> & { user_id: User['id'] },
    User
  >(),

  password: {
    replace_own: rpcMethodTypeContainer<
      {
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
