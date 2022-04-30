import type { NumberDisplayOptions } from '@mathesar/api/tables/columns';
import type { FormValues } from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/AppTypes';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
  AbstractTypeDbConfig,
} from '../types';

const DB_TYPES = {
  MONEY: 'MONEY',
  MATHESAR_TYPES__MATHESAR_MONEY: 'MATHESAR_TYPES__MATHESAR_MONEY',
};

const dbForm: AbstractTypeConfigForm = {
  variables: {
    decimalPlaces: {
      type: 'integer',
      default: null,
    },
    maxDigits: {
      type: 'integer',
      default: null,
    },
  },
  layout: {
    orientation: 'vertical',
    elements: [
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
  },
};

function determineDbTypeAndOptions(
  dbFormValues: FormValues,
  columnType: DbType,
): ReturnType<AbstractTypeDbConfig['determineDbTypeAndOptions']> {
  return {
    dbType: columnType,
    typeOptions: {
      precision: dbFormValues.maxDigits,
      scale: dbFormValues.decimalPlaces,
    },
  };
}

function constructDbFormValuesFromTypeOptions(
  columnType: DbType,
  typeOptions: Column['type_options'],
): FormValues {
  return {
    maxDigits: (typeOptions?.precision as number) ?? null,
    decimalPlaces: (typeOptions?.scale as number) ?? null,
  };
}

const displayForm: AbstractTypeConfigForm = {
  variables: {
    currencySymbol: {
      type: 'string',
      default: '$',
    },
    currencySymbolLocation: {
      type: 'string',
      enum: ['after-minus', 'end-with-space'],
      default: 'after-minus',
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
        variable: 'currencySymbol',
        label: 'Currency Symbol',
      },
      {
        type: 'input',
        variable: 'currencySymbolLocation',
        label: 'Currency Symbol Location',
        options: {
          'after-minus': { label: 'Start' },
          'end-with-space': { label: 'End' },
        },
      },
      {
        type: 'input',
        variable: 'numberFormat',
        label: 'Number Format',
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
  displayFormValues: FormValues,
): Column['display_options'] {
  return {
    currency_symbol: displayFormValues.currencySymbol,
    currency_symbol_location: displayFormValues.currencySymbolLocation,
    number_format:
      displayFormValues.numberFormat === 'none'
        ? null
        : displayFormValues.numberFormat,
  };
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): FormValues {
  const displayOptions = columnDisplayOpts as NumberDisplayOptions | null;
  const displayFormValues: FormValues = {
    format: displayOptions?.number_format ?? 'none',
  };
  return displayFormValues;
}

const moneyType: AbstractTypeConfiguration = {
  icon: '$',
  cell: {
    type: 'money',
  },
  defaultDbType: DB_TYPES.MATHESAR_TYPES__MATHESAR_MONEY,
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

export default moneyType;
