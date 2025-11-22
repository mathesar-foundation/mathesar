import { iconUiTypeUri } from '@mathesar/icons';

import { DB_TYPES } from '../dbTypes';
import type { AbstractTypeConfiguration } from '../types';

const uriType: AbstractTypeConfiguration = {
  getIcon: () => iconUiTypeUri,
  defaultDbType: DB_TYPES.MSAR__URI,
  cellInfo: {
    type: 'uri',
  },
};

export default uriType;
