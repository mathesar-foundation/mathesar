import { rpcMethodTypeContainer } from '@mathesar/packages/json-rpc-client-builder';
import type { Language } from '@mathesar/i18n/languages/utils';

export interface UnsavedUser {
    full_name: string | null;
    email: string | null;
    username: string;
    password: string;
    display_language: Language;
}

/* export interface User extends Omit<UnsavedUser, 'password'> {
    readonly id: number;
    readonly is_superuser: boolean;
} */

interface UserInfo {}

export const users = {
    list: rpcMethodTypeContainer<
        {},
        UserInfo[]
    >(),
    get: rpcMethodTypeContainer<{ user_id: number }, UserInfo>(),
    add: rpcMethodTypeContainer<
        {},
        UserInfo
    >(),
    delete: rpcMethodTypeContainer<{ user_id: number }, void>(),
    /* patch: rpcMethodTypeContainer<
        { user_id: number, user_info: }
    >(), */
}
