import { iconFile } from '@mathesar/icons';

import { DB_TYPES } from '../dbTypes';
import type { AbstractTypeConfiguration } from '../types';

const fileType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconFile, label: 'File' }),
  defaultDbType: DB_TYPES.JSONB,
  cellInfo: {
    type: 'file',
  },
};

export default fileType;
