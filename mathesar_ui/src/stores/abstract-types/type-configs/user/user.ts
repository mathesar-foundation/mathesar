import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import { getColumnMetadataValue } from '@mathesar/api/rpc/columns';
import type { DbType } from '@mathesar/AppTypes';
import { iconUser } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
  AbstractTypeDisplayConfig,
} from '../../types';

const dbForm: AbstractTypeConfigForm = {
  variables: {
    lastEditedBy: {
      type: 'boolean',
      default: false,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'lastEditedBy',
        label:
          'Use as "Last edited by" column. Will be set automatically and be non-editable.',
      },
    ],
  },
};

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
        label: 'Field to represent each user',
        options: {
          full_name: { label: 'Display Name' },
          email: { label: 'Email' },
          username: { label: 'Username' },
        },
      },
    ],
  },
};

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  return {
    dbType: columnType,
    typeOptions: {},
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: DbType,
  typeOptions: RawColumnWithMetadata['type_options'],
): FormValues {
  // Note: metadata is not available in this function signature
  // The value will be initialized from column metadata in constructDbForm
  // and updated via AbstractTypeControl watching dbFormValues
  return {
    lastEditedBy: false,
  };
}

function determineDisplayOptions(
  formValues: FormValues,
): RawColumnWithMetadata['metadata'] {
  return {
    user_display_field:
      (formValues.displayField as 'full_name' | 'email' | 'username') ??
      'full_name',
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: RawColumnWithMetadata['metadata'],
): FormValues {
  const column = { metadata };
  return {
    displayField:
      getColumnMetadataValue(column, 'user_display_field') ?? 'full_name',
  };
}

const userType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUser, label: 'User' }),
  defaultDbType: DB_TYPES.INTEGER,
  cellInfo: {
    type: 'user',
  },
  getEnabledState: () => ({
    enabled: true,
  }),
  getDbConfig: (): AbstractTypeDbConfig => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),
  getDisplayConfig: (): AbstractTypeDisplayConfig => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default userType;
