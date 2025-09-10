import { iconUiTypeJson } from '@mathesar/icons';

import { DB_TYPES } from '../dbTypes';
import type { AbstractTypeConfiguration } from '../types';

const jsonType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeJson, label: 'JSON' }),
  defaultDbType: DB_TYPES.JSONB,
  cellInfo: {
    type: 'string',
  },
};

export default jsonType;
