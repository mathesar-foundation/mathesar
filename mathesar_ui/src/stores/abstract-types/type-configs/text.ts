import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import type { FormValues } from '@mathesar-component-library/types';

import type { DbType } from '@mathesar/AppTypes';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

const DB_TYPES = {
  VARCHAR: 'character varying',
  CHAR: 'character',
  TEXT: 'text',
};

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
        label: 'Restrict Field Size',
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
        return DB_TYPES.VARCHAR;
      }
    }
    return columnType === DB_TYPES.CHAR ? DB_TYPES.CHAR : DB_TYPES.VARCHAR;
  }
  return DB_TYPES.TEXT;
}

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  const dbType = determineDbType(dbFormValues, columnType);
  const typeOptions: Column['type_options'] = {};
  if (dbType === DB_TYPES.CHAR || dbType === DB_TYPES.VARCHAR) {
    typeOptions.length = dbFormValues.length;
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
    case DB_TYPES.CHAR:
    case DB_TYPES.VARCHAR:
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
  icon: { data: faAlignLeft, label: 'Text' },
  defaultDbType: DB_TYPES.VARCHAR,
  cell: {
    type: 'string',
    config: {
      multiLine: true,
    },
    conditionalConfig: {
      [DB_TYPES.CHAR]: {
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
