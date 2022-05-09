import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import type { AbstractTypeConfiguration } from '../types';

const fallbackType: AbstractTypeConfiguration = {
  icon: { data: faQuestion },
  cell: {
    type: 'string',
  },
};

export default fallbackType;
