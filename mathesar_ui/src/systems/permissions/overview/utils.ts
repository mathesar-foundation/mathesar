import type { Readable } from 'svelte/store';

import type { Role } from '@mathesar/models/Role';
import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
import type { ImmutableMap } from '@mathesar-component-library';

import {
  type AccessLevelConfig,
  RoleAccessLevelAndPrivileges,
} from './RoleAccessLevelAndPrivileges';

export interface RolePrivileges<Privilege> {
  role_oid: Role['oid'];
  direct: Privilege[];
}

export interface AccessControlConfig<AccessLevel, Privilege> {
  allPrivileges: {
    id: Privilege;
    help: string;
  }[];
  access: {
    levels: readonly AccessLevelConfig<AccessLevel, Privilege>[];
    default: AccessLevel;
  };
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

export function getObjectAccessPrivilegeMap<A, P>(
  accessLevelConfig: readonly AccessLevelConfig<A, P>[],
  privilegesForRole: ImmutableMap<Role['oid'], RolePrivileges<P>>,
) {
  return privilegesForRole.mapValues(
    (entry) =>
      new RoleAccessLevelAndPrivileges({
        roleOid: entry.role_oid,
        accessLevelConfig,
        privileges: [...entry.direct],
        savedPrivileges: [...entry.direct],
      }),
  );
}
