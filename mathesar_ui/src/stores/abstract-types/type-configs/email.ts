import { iconUiTypeEmail } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  icon: iconUiTypeEmail,
  defaultDbType: 'mathesar_types.email',
  cellInfo: {
    type: 'string',
  },
};

export default emailType;
