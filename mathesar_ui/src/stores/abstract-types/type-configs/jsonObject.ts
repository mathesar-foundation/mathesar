import { iconUiTypeJsonObject } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const jsonObjectType: AbstractTypeConfiguration = {
  getIcon: () => iconUiTypeJsonObject,
  defaultDbType: 'mathesar_json_object',
  cellInfo: {
    type: 'string',
  },
};

export default jsonObjectType;
