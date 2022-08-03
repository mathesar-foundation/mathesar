import { iconHelp } from '@mathesar/icons';
import type { AbstractTypeConfiguration } from '../types';

const fallbackType: AbstractTypeConfiguration = {
  icon: { ...iconHelp, label: 'Unknown column type' },
  cell: {
    type: 'string',
  },
};

export default fallbackType;
