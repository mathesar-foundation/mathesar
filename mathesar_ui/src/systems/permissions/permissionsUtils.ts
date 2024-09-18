import type { Readable } from 'svelte/store';

import type { Role } from '@mathesar/models/Role';
import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
import type { ImmutableMap } from '@mathesar-component-library';

export interface RolePrivileges<Privilege> {
  role_oid: Role['oid'];
  direct: Privilege[];
}

export interface PermissionsMetaData<Privilege> {
  oid: number;
  owner_oid: Role['oid'];
  current_role_priv: Privilege[];
  current_role_owns: boolean;
}

export interface PermissionsAsyncStores<Privilege, E = string> {
  roles: Readable<AsyncStoreValue<ImmutableMap<Role['oid'], Role>, E>>;
  privilegesForRoles: Readable<
    AsyncStoreValue<ImmutableMap<number, RolePrivileges<Privilege>>, E>
  >;
  permissionsMetaData: Readable<
    AsyncStoreValue<PermissionsMetaData<Privilege>, E>
  >;
}
