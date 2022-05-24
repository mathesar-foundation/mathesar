import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { AbstractTypeConfiguration } from '../types';

const DB_TYPES = {
  MATHESAR_TYPES__URI: 'mathesar_types.uri',
};

const uriType: AbstractTypeConfiguration = {
  icon: { data: faGlobe },
  defaultDbType: DB_TYPES.MATHESAR_TYPES__URI,
  cell: {
    type: 'uri',
  },
};

export default uriType;
