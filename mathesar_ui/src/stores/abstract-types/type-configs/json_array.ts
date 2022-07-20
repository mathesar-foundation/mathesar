import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import type { AbstractTypeConfiguration } from '../types';

const jsonArrayType: AbstractTypeConfiguration = {
  icon: { data: faEnvelope },
  defaultDbType: 'mathesar_json_array',
  cell: {
    type: 'string',
  },
};

export default jsonArrayType;