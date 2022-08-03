import { iconEnvelope } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const jsonObjectType: AbstractTypeConfiguration = {
  icon: iconEnvelope,
  defaultDbType: 'mathesar_json_object',
  cell: {
    type: 'string',
  },
};

export default jsonObjectType;
