import { iconUiTypeArray } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const fallbackType: AbstractTypeConfiguration = {
  getIcon: () => [
    { ...iconUiTypeArray, label: 'Array' },
    { ...iconUiTypeArray, label: 'Array' },
  ],
  cellInfo: {
    type: 'array',
  },
};

export default fallbackType;
