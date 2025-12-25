import { iconUiTypeEmail } from '@mathesar/icons';

import { DB_TYPES } from '../dbTypes';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeEmail, label: 'Email' }),
  defaultDbType: DB_TYPES.MSAR__EMAIL,
  cellInfo: {
    type: 'email',
  },
};

export default emailType;
