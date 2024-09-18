import {
  type Column,
  type CurrencyLocation,
  type NumberFormat,
  type NumberGrouping,
  getColumnMetadataValue,
} from '@mathesar/api/rpc/columns';
import { iconUiTypeMoney } from '@mathesar/icons';
import type { FormValues } from '@mathesar-component-library/types';

import { DB_TYPES } from '../dbTypes';
import type {
  AbstractTypeConfigForm,
  AbstractTypeConfiguration,
} from '../types';

import { getDecimalPlaces } from './number';

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
      enum: ['auto', 'always', 'never'],
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
          auto: { label: 'Auto' },
          always: { label: 'Always' },
          never: { label: 'Never' },
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
  currencySymbol: string;
  decimalPlaces: number | null;
  currencySymbolLocation: CurrencyLocation;
  numberFormat: NumberFormat | 'none';
  useGrouping: NumberGrouping;
}

function determineDisplayOptions(form: FormValues): Column['metadata'] {
  const f = form as MoneyFormValues;
  const opts: Partial<Column['metadata']> = {
    mon_currency_symbol: f.currencySymbol,
    mon_currency_location: f.currencySymbolLocation,
    num_format: f.numberFormat === 'none' ? null : f.numberFormat,
    num_grouping: f.useGrouping,
    num_min_frac_digits: f.decimalPlaces ?? undefined,
    num_max_frac_digits: f.decimalPlaces ?? undefined,
  };
  return opts;
}

function constructDisplayFormValuesFromDisplayOptions(
  metadata: Column['metadata'],
): MoneyFormValues {
  const column = { metadata };
  const decimalPlaces = getDecimalPlaces(
    metadata?.num_min_frac_digits ?? null,
    metadata?.num_max_frac_digits ?? null,
  );
  const displayFormValues: MoneyFormValues = {
    numberFormat: getColumnMetadataValue(column, 'num_format') ?? 'none',
    currencySymbol: getColumnMetadataValue(column, 'mon_currency_symbol') ?? '',
    decimalPlaces,
    currencySymbolLocation: getColumnMetadataValue(
      column,
      'mon_currency_location',
    ),
    useGrouping: getColumnMetadataValue(column, 'num_grouping'),
  };
  return displayFormValues;
}

const moneyType: AbstractTypeConfiguration = {
  getIcon: () => iconUiTypeMoney,
  cellInfo: {
    type: 'money',
  },
  defaultDbType: DB_TYPES.MSAR__MATHESAR_MONEY,
  getDisplayConfig: () => ({
    form: displayForm,
    determineDisplayOptions,
    constructDisplayFormValuesFromDisplayOptions,
  }),
};

export default moneyType;
