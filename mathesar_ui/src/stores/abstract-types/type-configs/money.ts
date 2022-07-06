import { faDollarSign } from '@fortawesome/free-solid-svg-icons';
import type {
  MoneyDisplayOptions,
  NumberFormat,
} from '@mathesar/api/tables/columns';
import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';
import { getDecimalPlaces } from './number';

const DB_TYPES = {
  MONEY: 'MONEY',
  MATHESAR_TYPES__MATHESAR_MONEY: 'MATHESAR_TYPES.MATHESAR_MONEY',
};

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
    decimalPlaces: {
      type: 'integer',
      default: null,
    },
    useGrouping: {
      type: 'string',
      enum: ['true', 'false', 'auto'],
      default: 'auto',
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
        variable: 'decimalPlaces',
        label: 'Decimal Places',
      },
      {
        type: 'input',
        variable: 'useGrouping',
        label: 'Digit Grouping',
        options: {
          true: { label: 'On' },
          false: { label: 'Off' },
          auto: { label: 'Auto' },
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

interface MoneyFormValues extends Record<string, unknown> {
  currencySymbol: MoneyDisplayOptions['currency_symbol'];
  decimalPlaces: MoneyDisplayOptions['minimum_fraction_digits'];
  currencySymbolLocation: MoneyDisplayOptions['currency_symbol_location'];
  numberFormat: NumberFormat | 'none';
  useGrouping: MoneyDisplayOptions['use_grouping'];
}

function determineDisplayOptions(form: FormValues): Column['display_options'] {
  const f = form as MoneyFormValues;
  const opts: Partial<MoneyDisplayOptions> = {
    currency_symbol: f.currencySymbol,
    currency_symbol_location: f.currencySymbolLocation,
    number_format: f.numberFormat === 'none' ? null : f.numberFormat,
    use_grouping: f.useGrouping,
    minimum_fraction_digits: f.decimalPlaces ?? undefined,
    maximum_fraction_digits: f.decimalPlaces ?? undefined,
  };
  return opts;
}

function constructDisplayFormValuesFromDisplayOptions(
  columnDisplayOpts: Column['display_options'],
): MoneyFormValues {
  const displayOptions = columnDisplayOpts as MoneyDisplayOptions | null;
  const decimalPlaces = getDecimalPlaces(
    displayOptions?.minimum_fraction_digits ?? null,
    displayOptions?.maximum_fraction_digits ?? null,
  );
  const displayFormValues: MoneyFormValues = {
    numberFormat: displayOptions?.number_format ?? 'none',
    currencySymbol: displayOptions?.currency_symbol ?? '',
    decimalPlaces,
    currencySymbolLocation:
      displayOptions?.currency_symbol_location ?? 'after-minus',
    useGrouping: displayOptions?.use_grouping ?? 'auto',
  };
  return displayFormValues;
}

const moneyType: AbstractTypeConfiguration = {
  icon: { data: faDollarSign },
  cell: {
    type: 'money',
  },
  defaultDbType: DB_TYPES.MATHESAR_TYPES__MATHESAR_MONEY,
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default moneyType;
