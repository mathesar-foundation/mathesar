import { iconAdminUser, iconUser } from '@mathesar/icons';
import type { UserModel } from '@mathesar/stores/users';
import {
  type IconProps,
  assertExhaustive,
} from '@mathesar-component-library/types';

export type UserType = 'admin' | 'standard';

function getDisplayNameForUserType(userType: UserType): string {
  switch (userType) {
    case 'admin':
      return 'Admin';
    case 'standard':
      return 'Standard';
    default:
      return assertExhaustive(userType);
  }
}

export function getUserTypeInfoFromUserModel(userModel: UserModel): {
  icon: IconProps;
  type: UserType;
  displayName: string;
} {
  const type: UserType = userModel.isMathesarAdmin ? 'admin' : 'standard';
  const displayName = getDisplayNameForUserType(type);
  const icon = userModel.isMathesarAdmin ? iconAdminUser : iconUser;
  return {
    icon,
    type,
    displayName,
  };
}
