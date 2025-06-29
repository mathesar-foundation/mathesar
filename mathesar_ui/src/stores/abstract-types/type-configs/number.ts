import type {
  NumberFormat,
  NumberGrouping,
} from '@mathesar/api/rpc/_common/columnDisplayOptions';
import {
  type RawColumnWithMetadata,
  getColumnMetadataValue,
} from '@mathesar/api/rpc/columns';
import type { DbType } from '@mathesar/AppTypes';
import { iconUiTypeNumber } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

const dbForm: AbstractTypeConfigForm = {
  variables: {
    numberType: {
      type: 'string',
      enum: ['Integer', 'Decimal', 'Float'],
      default: 'Decimal',
    },
    integerDataSize: {
      type: 'string',
      enum: ['default', 'bigInt', 'smallInt'],
      default: 'default',
    },
    decimalPlaces: {
      type: 'integer',
      default: null,
    },
    maxDigits: {
      type: 'integer',
      default: null,
    },
    floatingPointType: {
      type: 'string',
      enum: ['real', 'doublePrecision'],
      default: 'real',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'numberType',
        label: 'Number Type',
      },
      {
        type: 'switch',
        variable: 'numberType',
        cases: {
          Integer: [
            {
              type: 'input',
              variable: 'integerDataSize',
              label: 'Integer Data Size',
              interfaceType: 'select',
              options: {
                default: { label: 'Default (4 bytes)' },
                bigInt: { label: 'Big Integer (8 bytes)' },
                smallInt: { label: 'Small Integer (2 bytes)' },
              },
            },
          ],
          Decimal: [
            {
              type: 'layout',
              orientation: 'horizontal',
              elements: [
                {
                  type: 'input',
                  variable: 'decimalPlaces',
                  label: 'Decimal Places',
                },
                {
                  type: 'input',
                  variable: 'maxDigits',
                  label: 'Max Digits',
                },
              ],
            },
          ],
          Float: [
            {
              type: 'input',
              variable: 'floatingPointType',
              label: 'Floating Point Type',
              interfaceType: 'select',
              options: {
                real: { label: 'Real (6 digits)' },
                doublePrecision: {
                  label: 'Double Precision (15 digits)',
                },
              },
            },
          ],
        },
      },
    ],
  },
};

function determineDbType(dbFormValues: FormValues, columnType: DbType): DbType {
  switch (dbFormValues.numberType) {
    case 'Integer':
      switch (dbFormValues.integerDataSize) {
        case 'smallInt':
          return DB_TYPES.SMALLINT;
        case 'bigInt':
          return DB_TYPES.BIGINT;
        default:
          return DB_TYPES.INTEGER;
      }
    case 'Float':
      switch (dbFormValues.floatingPointType) {
        case 'real':
          return DB_TYPES.REAL;
        case 'doublePrecision':
        default:
          return DB_TYPES.DOUBLE_PRECISION;
      }
    case 'Decimal':
    default:
      return columnType === DB_TYPES.DECIMAL
        ? DB_TYPES.DECIMAL
        : DB_TYPES.NUMERIC;
  }
}

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  const dbType = determineDbType(dbFormValues, columnType);
  const typeOptions: RawColumnWithMetadata['type_options'] = {};

  if (dbType === DB_TYPES.DECIMAL || dbType === DB_TYPES.NUMERIC) {
    if (dbFormValues.maxDigits !== null) {
      typeOptions.precision = Number(dbFormValues.maxDigits);
    }
    if (dbFormValues.decimalPlaces !== null) {
      typeOptions.scale = Number(dbFormValues.decimalPlaces);
    }
  }

  return {
    dbType,
    typeOptions,
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: DbType,
  typeOptions: RawColumnWithMetadata['type_options'],
): FormValues {
  switch (columnType) {
    case DB_TYPES.SMALLINT:
      return {
        numberType: 'Integer',
        integerDataSize: 'smallInt',
      };
    case DB_TYPES.BIGINT:
      return {
        numberType: 'Integer',
        integerDataSize: 'bigInt',
      };
    case DB_TYPES.REAL:
      return {
        numberType: 'Float',
        floatingPointType: 'real',
      };
    case DB_TYPES.DOUBLE_PRECISION:
      return {
        numberType: 'Float',
        floatingPointType: 'doublePrecision',
      };
    case DB_TYPES.INTEGER:
      return {
        numberType: 'Integer',
        integerDataSize: 'default',
      };
    case DB_TYPES.DECIMAL:
    case DB_TYPES.NUMERIC:
    default:
      return {
        numberType: 'Decimal',
        maxDigits: (typeOptions?.precision as number) ?? null,
        decimalPlaces: (typeOptions?.scale as number) ?? null,
      };
  }
}

const displayForm: AbstractTypeConfigForm = {
  variables: {
    decimalPlaces: {
      type: 'integer',
      default: null,
    },
    useGrouping: {
      type: 'string',
      enum: ['auto', 'always', 'never'],
      default: 'auto',
    },
    numberFormat: {
      type: 'string',
      enum: ['none', 'english', 'german', 'french', 'hindi', 'swiss'],
      default: 'none',
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
      {
        type: 'input',
        variable: 'decimalPlaces',
        label: 'Decimal Places',
      },
      {
        type: 'input',
        variable: 'useGrouping',
        label: 'Digit Grouping',
        options: {
          auto: { label: 'Auto' },
          always: { label: 'Always' },
          never: { label: 'Never' },
        },
      },
      {
        type: 'input',
        variable: 'numberFormat',
        label: 'Format',
        options: {
          none: { label: 'Use browser locale' },
          english: { label: '1,234,567.89' },
          german: { label: '1.234.567,89' },
          french: { label: '1 234 567,89' },
          hindi: { label: '12,34,567.89' },
          swiss: { label: "1'234'567.89" },
        },
      },
    ],
  },
};

function determineDisplayOptions(
  formValues: FormValues,
): RawColumnWithMetadata['metadata'] {
  const decimalPlaces = formValues.decimalPlaces as number | null;
  const opts: Partial<RawColumnWithMetadata['metadata']> = {
    num_format:
      formValues.numberFormat === 'none'
        ? undefined
        : (formValues.numberFormat as NumberFormat),
    num_grouping:
      (formValues.useGrouping as NumberGrouping | undefined) ?? 'auto',
    num_min_frac_digits: decimalPlaces ?? undefined,
    num_max_frac_digits: decimalPlaces ?? undefined,
  };
  return opts;
}

export function getDecimalPlaces(
  minimumFractionDigits: number | null,
  maximumFractionDigits: number | null,
): number | null {
  if (minimumFractionDigits === null && maximumFractionDigits === null) {
    return null;
  }
  if (minimumFractionDigits === null) {
    return maximumFractionDigits;
  }
  if (maximumFractionDigits === null) {
    return minimumFractionDigits;
  }
  return Math.max(minimumFractionDigits, maximumFractionDigits);
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: RawColumnWithMetadata['metadata'],
): FormValues {
  const column = { metadata };
  const decimalPlaces = getDecimalPlaces(
    metadata?.num_min_frac_digits ?? null,
    metadata?.num_max_frac_digits ?? null,
  );
  const formValues: FormValues = {
    numberFormat: getColumnMetadataValue(column, 'num_format'),
    useGrouping: getColumnMetadataValue(column, 'num_grouping'),
    decimalPlaces,
  };
  return formValues;
}

const numberType: AbstractTypeConfiguration = {
  getIcon: () => ({ ...iconUiTypeNumber, label: 'Number' }),
  cellInfo: {
    type: 'number',
    conditionalConfig: {
      [DB_TYPES.DECIMAL]: { floatAllowanceStrategy: 'scale-based' },
      [DB_TYPES.NUMERIC]: { floatAllowanceStrategy: 'scale-based' },
      [DB_TYPES.INTEGER]: { floatAllowanceStrategy: 'never' },
      [DB_TYPES.SMALLINT]: { floatAllowanceStrategy: 'never' },
      [DB_TYPES.BIGINT]: { floatAllowanceStrategy: 'never' },
      [DB_TYPES.REAL]: { floatAllowanceStrategy: 'always' },
      [DB_TYPES.DOUBLE_PRECISION]: { floatAllowanceStrategy: 'always' },
    },
  },
  defaultDbType: DB_TYPES.NUMERIC,
  getDbConfig: () => ({
    form: dbForm,
    determineDbTypeAndOptions,
    constructDbFormValuesFromTypeOptions,
  }),
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default numberType;
