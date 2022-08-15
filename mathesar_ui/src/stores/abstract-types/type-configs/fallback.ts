import { iconUiTypeUnknown } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const fallbackType: AbstractTypeConfiguration = {
  icon: { ...iconUiTypeUnknown, label: 'Unknown column type' },
  cell: {
    type: 'string',
  },
};

export default fallbackType;
