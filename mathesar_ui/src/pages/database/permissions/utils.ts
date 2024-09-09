import type {
  DatabasePrivilege,
  RawDatabasePrivilegesForRole,
} from '@mathesar/api/rpc/databases';
import type { Role } from '@mathesar/models/Role';
import { type ImmutableMap, ImmutableSet } from '@mathesar-component-library';

type AccessLevelConfig<A, P> = { id: A; privileges: Set<P> };

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

export const dbAccessLevelConfigs: {
  id: string;
  privileges: Set<DatabasePrivilege>;
}[] = [
  { id: 'connect', privileges: new Set(['CONNECT']) },
  { id: 'connect_and_create', privileges: new Set(['CONNECT', 'CREATE']) },
];

export function getDbAccessPrivilegeMap(
  dbPrivileges: ImmutableMap<Role['oid'], RawDatabasePrivilegesForRole>,
) {
  return dbPrivileges.mapValues(
    (entry) =>
      new RoleAccessLevelAndPrivileges({
        roleOid: entry.role_oid,
        accessLevelConfigs: dbAccessLevelConfigs,
        privileges: entry.direct,
        savedPrivileges: entry.direct,
      }),
  );
}
