import { iconUiTypeEnum } from '@mathesar/icons';

import type { AbstractTypeConfiguration } from '../types';

const enumType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeEnum, label: 'Enum' }),
  cellInfo: {
    type: 'enum',
  },
};

export default enumType;
