import type { Role } from '@mathesar/models/Role';
import { ImmutableSet } from '@mathesar-component-library';

export type AccessLevelConfig<A, P> = {
  id: A;
  privileges: Set<P>;
  name: string;
  help: string;
};

export const customAccess = 'custom' as const;

type Props<A, P> = {
  roleOid: Role['oid'];
  accessLevelConfig: readonly AccessLevelConfig<A, P>[];
  savedPrivileges?: P[];
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
);

function getAccessLevelBasedOnPrivileges<A, P>(
  accessLevelConfig: readonly AccessLevelConfig<A, P>[],
  privileges: ImmutableSet<P>,
): A | typeof customAccess {
  const accessLevelObject = accessLevelConfig.find((entry) =>
    privileges.equals(entry.privileges),
  );
  return accessLevelObject ? accessLevelObject.id : customAccess;
}

export class RoleAccessLevelAndPrivileges<A, P> {
  readonly roleOid;

  readonly accessLevelConfig;

  readonly accessLevel: A | typeof customAccess;

  readonly privileges: ImmutableSet<P>;

  readonly savedPrivileges;

  constructor(props: Props<A, P>) {
    this.accessLevelConfig = props.accessLevelConfig;
    this.roleOid = props.roleOid;
    this.savedPrivileges = props.savedPrivileges;
    if (
      'privileges' in props &&
      'accessLevel' in props &&
      props.accessLevel === customAccess
    ) {
      this.accessLevel = customAccess;
      this.privileges = new ImmutableSet(props.privileges);
    } else if ('privileges' in props) {
      this.privileges = new ImmutableSet(props.privileges);
      this.accessLevel = getAccessLevelBasedOnPrivileges(
        this.accessLevelConfig,
        this.privileges,
      );
    } else {
      this.accessLevel = props.accessLevel;
      const aL = this.accessLevelConfig.find(
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
      accessLevelConfig: this.accessLevelConfig,
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
    const customPrivileges =
      privileges ?? this.savedPrivileges ?? this.privileges.valuesArray();
    return new RoleAccessLevelAndPrivileges<A, P>({
      ...this.getCommonProps(),
      accessLevel: customAccess,
      privileges: customPrivileges,
    });
  }
}
