import type { Role } from '@mathesar/models/Role';
import type { ImmutableMap } from '@mathesar-component-library';

import type { RolePrivileges } from '../permissionsUtils';

import {
  type AccessLevelConfig,
  RoleAccessLevelAndPrivileges,
} from './RoleAccessLevelAndPrivileges';

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
