import { iconUiTypeJsonObject } from '@mathesar/icons';
import type { AbstractTypeConfigurationFactory } from '../../types';

const jsonObjectFactory: AbstractTypeConfigurationFactory = () => ({
  getIcon: () => iconUiTypeJsonObject,
  defaultDbType: 'mathesar_json_object',
  cellInfo: {
    type: 'string',
  },
});

export default jsonObjectFactory;
