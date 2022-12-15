import { iconUiTypeJsonArray } from '@mathesar/icons';
import type { AbstractTypeConfigurationFactory } from '../../types';

const jsonArrayFactory: AbstractTypeConfigurationFactory = () => ({
  getIcon: () => iconUiTypeJsonArray,
  defaultDbType: 'mathesar_types.mathesar_json_array',
  cellInfo: {
    type: 'string',
  },
});

export default jsonArrayFactory;
