import { iconUser } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../../types';
import { DB_TYPES } from '../../dbTypes';

const userType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUser, label: 'User' }),
  defaultDbType: DB_TYPES.INTEGER,
  cellInfo: {
    type: 'user',
  },
  getEnabledState: () => {
    return {
      enabled: true,
    };
  },
};

export default userType;
