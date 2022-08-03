import { iconGlobe } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const DB_TYPES = {
  MATHESAR_TYPES__URI: 'mathesar_types.uri',
};

const uriType: AbstractTypeConfiguration = {
  icon: iconGlobe,
  defaultDbType: DB_TYPES.MATHESAR_TYPES__URI,
  cell: {
    type: 'uri',
  },
};

export default uriType;
