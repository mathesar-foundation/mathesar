import { iconUiTypeUuid } from '@mathesar/icons';

import { DB_TYPES } from '../dbTypes';
import type { AbstractTypeConfiguration } from '../types';

const uuidType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeUuid, label: 'UUID' }),
  defaultDbType: DB_TYPES.UUID,
  cellInfo: {
    type: 'string',
  },
};

export default uuidType;
