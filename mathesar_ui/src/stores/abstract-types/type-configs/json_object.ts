import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import type { AbstractTypeConfiguration } from '../types';

const jsonObjectType: AbstractTypeConfiguration = {
  icon: { data: faEnvelope },
  defaultDbType: 'mathesar_json_object',
  cell: {
    type: 'string',
  },
};

export default jsonObjectType;