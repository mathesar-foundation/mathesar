import { iconUiTypeEmail } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeEmail, label: 'Email' }),
  defaultDbType: 'mathesar_types.email',
  cellInfo: {
    type: 'string',
  },
};

export default emailType;
