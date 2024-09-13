import type { Column } from '@mathesar/api/rpc/columns';
import type { DbType } from '@mathesar/AppTypes';
import { iconUiTypeText } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

const dbForm: AbstractTypeConfigForm = {
  variables: {
    restrictFieldSize: {
      type: 'boolean',
      default: false,
    },
    length: {
      type: 'integer',
      default: 255,
      validation: {
        checks: ['isEmpty'],
      },
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'restrictFieldSize',
        label: 'Set a maximum length',
      },
      {
        type: 'if',
        variable: 'restrictFieldSize',
        condition: 'eq',
        value: true,
        elements: [
          {
            type: 'input',
            variable: 'length',
            label: 'Field Size Limit',
          },
        ],
      },
    ],
  },
};

function determineDbType(dbFormValues: FormValues, columnType: DbType): DbType {
  if (dbFormValues.restrictFieldSize) {
    const { length } = dbFormValues;
    if (typeof length === 'string' || typeof length === 'number') {
      const integerValueOfLength =
        typeof length === 'string' ? parseInt(length, 10) : length;
      if (integerValueOfLength > 255) {
        return DB_TYPES.CHARACTER_VARYING;
      }
    }
    return columnType === DB_TYPES.CHARACTER
      ? DB_TYPES.CHARACTER
      : DB_TYPES.CHARACTER_VARYING;
  }
  return DB_TYPES.TEXT;
}

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  const dbType = determineDbType(dbFormValues, columnType);
  const typeOptions: Column['type_options'] = {};
  if (dbType === DB_TYPES.CHARACTER || dbType === DB_TYPES.CHARACTER_VARYING) {
    typeOptions.length = Number(dbFormValues.length);
  }
  return {
    dbType,
    typeOptions,
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: DbType,
  typeOptions: Column['type_options'],
): FormValues {
  switch (columnType) {
    case DB_TYPES.CHARACTER:
    case DB_TYPES.CHARACTER_VARYING:
      return {
        length: (typeOptions?.length as number) ?? null,
        restrictFieldSize: true,
      };
    default:
      return {
        restrictFieldSize: false,
      };
  }
}

const textType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeText, label: 'Text' }),
  defaultDbType: DB_TYPES.CHARACTER_VARYING,
  cellInfo: {
    type: 'string',
    config: {
      multiLine: true,
    },
    conditionalConfig: {
      [DB_TYPES.CHARACTER]: {
        multiLine: false,
      },
    },
  },
  getDbConfig: () => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),
};

export default textType;
