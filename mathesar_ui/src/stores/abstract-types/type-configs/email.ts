import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import type { AbstractTypeConfiguration } from '../types';

const emailType: AbstractTypeConfiguration = {
  icon: { data: faEnvelope },
  defaultDbType: 'mathesar_types.email',
  cell: {
    type: 'email',
  },
};

export default emailType;
