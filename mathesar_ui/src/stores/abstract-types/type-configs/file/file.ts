import { iconFile } from '@mathesar/icons';
import type { ComponentWithProps } from '@mathesar-component-library/types';

// eslint-disable-next-line import/no-cycle
import { isFileTypeSupported } from '../../abstractTypeCategories';
import { DB_TYPES } from '../../dbTypes';
import type { AbstractTypeConfiguration } from '../../types';

import FileDisabledHelp from './FileDisabledHelp.svelte';

function getDisabledCause(): ComponentWithProps<FileDisabledHelp> {
  return { component: FileDisabledHelp, props: {} };
}

const fileType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconFile, label: 'File' }),
  defaultDbType: DB_TYPES.JSONB,
  cellInfo: {
    type: 'file',
  },
  getEnabledState: () => {
    if (isFileTypeSupported()) {
      return {
        enabled: true,
      };
    }
    return {
      enabled: false,
      cause: getDisabledCause(),
    };
  },
};

export default fileType;
