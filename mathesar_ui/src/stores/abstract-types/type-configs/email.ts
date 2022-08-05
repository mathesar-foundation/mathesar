import { iconUiTypeEmail } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  icon: iconUiTypeEmail,
  defaultDbType: 'mathesar_types.email',
  cell: {
    type: 'string',
  },
};

export default emailType;
