import type { Readable } from 'svelte/store';

import type { ObjectCurrentAccess } from '@mathesar/models/internal/ObjectCurrentAccess';
import type { Role } from '@mathesar/models/Role';
import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
import type { ImmutableMap } from '@mathesar-component-library';

export interface RolePrivileges<Privilege> {
  role_oid: Role['oid'];
  direct: Privilege[];
}

export interface PermissionsMetaData<Privilege> {
  oid: number;
  currentAccess: ObjectCurrentAccess<Privilege>;
}

export interface PermissionsStoreValues<Privilege> {
  roles: ImmutableMap<Role['oid'], Role>;
  privilegesForRoles: ImmutableMap<number, RolePrivileges<Privilege>>;
  permissionsMetaData: PermissionsMetaData<Privilege>;
  currentRole: {
    currentRoleOid: Role['oid'];
    parentRoleOids: Set<Role['oid']>;
  };
}

export interface PermissionsAsyncStores<Privilege, E = string> {
  roles: Readable<
    AsyncStoreValue<PermissionsStoreValues<Privilege>['roles'], E>
  >;
  privilegesForRoles: Readable<
    AsyncStoreValue<PermissionsStoreValues<Privilege>['privilegesForRoles'], E>
  >;
  permissionsMetaData: Readable<
    AsyncStoreValue<PermissionsStoreValues<Privilege>['permissionsMetaData'], E>
  >;
  currentRole: Readable<
    AsyncStoreValue<PermissionsStoreValues<Privilege>['currentRole'], E>
  >;
}

export interface PermissionsModalSlots<Privilege> {
  share: {
    storeValues: PermissionsStoreValues<Privilege>;
  };
  'transfer-ownership': {
    storeValues: PermissionsStoreValues<Privilege>;
  };
}
