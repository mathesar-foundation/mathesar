import type { Readable } from 'svelte/store';

import type { Role } from '@mathesar/models/Role';
import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
import { type ImmutableMap, ImmutableSet } from '@mathesar-component-library';

export type AccessLevelConfig<A, P> = { id: A; privileges: Set<P> };

export const customAccess = 'custom' as const;

function getAccessLevelBasedOnPrivileges<A, P>(
  accessLevelConfigs: AccessLevelConfig<A, P>[],
  privileges: ImmutableSet<P>,
): A | typeof customAccess {
  const accessLevelObject = accessLevelConfigs.find((entry) =>
    privileges.equals(entry.privileges),
  );
  return accessLevelObject ? accessLevelObject.id : customAccess;
}

type Props<A, P> = {
  roleOid: Role['oid'];
  accessLevelConfigs: AccessLevelConfig<A, P>[];
  isAccessRemoved?: boolean;
  savedPrivileges: P[];
} & (
  | {
      privileges: P[];
    }
  | {
      accessLevel: A;
    }
  | {
      privileges: P[];
      accessLevel: typeof customAccess;
    }
  | {
      accessLevel: undefined;
      privileges: [];
    }
);

export class RoleAccessLevelAndPrivileges<A, P> {
  readonly roleOid;

  readonly accessLevelConfigs;

  readonly accessLevel: A | typeof customAccess | undefined;

  readonly privileges: ImmutableSet<P>;

  readonly savedPrivileges: P[];

  constructor(props: Props<A, P>) {
    this.accessLevelConfigs = props.accessLevelConfigs;
    this.roleOid = props.roleOid;
    this.savedPrivileges = props.savedPrivileges;
    if ('privileges' in props && 'accessLevel' in props) {
      this.accessLevel = props.accessLevel;
      this.privileges = new ImmutableSet(props.privileges);
    } else if ('privileges' in props) {
      this.privileges = new ImmutableSet(props.privileges);
      this.accessLevel = getAccessLevelBasedOnPrivileges(
        this.accessLevelConfigs,
        this.privileges,
      );
    } else {
      this.accessLevel = props.accessLevel;
      const aL = this.accessLevelConfigs.find(
        (entry) => entry.id === this.accessLevel,
      );
      if (!aL) {
        throw new Error(
          'Access level not found in configuration. This should never occur.',
        );
      }
      this.privileges = new ImmutableSet(aL.privileges);
    }
  }

  private getCommonProps() {
    return {
      roleOid: this.roleOid,
      accessLevelConfigs: this.accessLevelConfigs,
      savedPrivileges: this.savedPrivileges,
    };
  }

  withAccess(accessLevel: A) {
    return new RoleAccessLevelAndPrivileges<A, P>({
      ...this.getCommonProps(),
      accessLevel,
    });
  }

  withCustomAccess(privileges?: P[]) {
    const customPrivileges = privileges ?? this.savedPrivileges;
    return new RoleAccessLevelAndPrivileges<A, P>({
      ...this.getCommonProps(),
      accessLevel: customAccess,
      privileges: customPrivileges,
    });
  }

  withAccessRemoved() {
    return new RoleAccessLevelAndPrivileges<A, P>({
      ...this.getCommonProps(),
      accessLevel: undefined,
      privileges: [],
    });
  }
}

export interface RoleWithPrivileges<Privilege> {
  role_oid: Role['oid'];
  direct: Privilege[];
}

export function getObjectAccessPrivilegeMap<A, P>(
  accessLevelConfigs: AccessLevelConfig<A, P>[],
  dbPrivileges: ImmutableMap<Role['oid'], RoleWithPrivileges<P>>,
) {
  return dbPrivileges.mapValues(
    (entry) =>
      new RoleAccessLevelAndPrivileges({
        roleOid: entry.role_oid,
        accessLevelConfigs,
        privileges: entry.direct,
        savedPrivileges: entry.direct,
      }),
  );
}

export interface AsyncStoresValues<Privilege> {
  roles: Readable<AsyncStoreValue<ImmutableMap<Role['oid'], Role>, string>>;
  objectPrivileges: Readable<
    AsyncStoreValue<ImmutableMap<number, RoleWithPrivileges<Privilege>>, string>
  >;
  objectOwnerAndCurrentRolePrivileges: Readable<
    AsyncStoreValue<
      {
        oid: number;
        owner_oid: Role['oid'];
        current_role_priv: Privilege[];
        current_role_owns: boolean;
      },
      string
    >
  >;
}
