import { iconUiTypeUnknown } from '@mathesar/icons';

import type { AbstractTypeConfiguration } from '../types';

const enumType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeUnknown, label: 'Enum' }),
  cellInfo: {
    type: 'enum',
  },
};

export default enumType;
