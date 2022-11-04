import { iconUiTypeUnknown } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const fallbackType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeUnknown, label: 'Unknown column type' }),
  cellInfo: {
    type: 'string',
  },
};

export default fallbackType;
