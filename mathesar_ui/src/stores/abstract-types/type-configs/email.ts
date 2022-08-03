import { iconEnvelope } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  icon: iconEnvelope,
  defaultDbType: 'mathesar_types.email',
  cell: {
    type: 'string',
  },
};

export default emailType;
