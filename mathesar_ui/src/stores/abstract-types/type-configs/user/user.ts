import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import { getColumnMetadataValue } from '@mathesar/api/rpc/columns';
import { iconUser } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDisplayConfig,
} from '../../types';

const displayForm: AbstractTypeConfigForm = {
  variables: {
    displayField: {
      type: 'string',
      enum: ['full_name', 'email', 'username'],
      default: 'full_name',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'displayField',
        label: 'Display',
        options: {
          full_name: { label: 'Display Name' },
          email: { label: 'Email' },
          username: { label: 'Username' },
        },
      },
    ],
  },
};

function determineDisplayOptions(
  formValues: FormValues,
): RawColumnWithMetadata['metadata'] {
  return {
    user_display_field: (formValues.displayField as 'full_name' | 'email' | 'username') ?? 'full_name',
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: RawColumnWithMetadata['metadata'],
): FormValues {
  const column = { metadata };
  return {
    displayField: getColumnMetadataValue(column, 'user_display_field') ?? 'full_name',
  };
}

const userType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUser, label: 'User' }),
  defaultDbType: DB_TYPES.INTEGER,
  cellInfo: {
    type: 'user',
  },
  getEnabledState: () => {
    return {
      enabled: true,
    };
  },
  getDisplayConfig: (): AbstractTypeDisplayConfig => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default userType;
