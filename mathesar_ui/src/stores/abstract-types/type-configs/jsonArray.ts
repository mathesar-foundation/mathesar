import { iconUiTypeJsonArray } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const jsonArrayType: AbstractTypeConfiguration = {
  icon: iconUiTypeJsonArray,
  defaultDbType: 'mathesar_json_array',
  cell: {
    type: 'string',
  },
};

export default jsonArrayType;
