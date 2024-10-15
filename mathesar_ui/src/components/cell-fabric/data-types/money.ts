import {
  type Column,
  type NumberFormat,
  getColumnMetadataValue,
} from '@mathesar/api/rpc/columns';
import {
  StringifiedNumberFormatter,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import MoneyCell from './components/money/MoneyCell.svelte';
import MoneyCellInput from './components/money/MoneyCellInput.svelte';
import type { MoneyCellExternalProps } from './components/typeDefinitions';
import { getUseGrouping } from './number';
import type { CellComponentFactory } from './typeDefinitions';

// prettier-ignore
const localeMap = new Map<NumberFormat, string>([
  ['english' , 'en'    ],
  ['german'  , 'de'    ],
  ['french'  , 'fr'    ],
  ['hindi'   , 'hi'    ],
  ['swiss'   , 'de-CH' ],
]);

function ColumnIsInteger(column: Column): boolean {
  return (column.type_options?.scale ?? Infinity) === 0;
}

function getFormatterOptions(
  column: Column,
): MoneyCellExternalProps['formatterOptions'] {
  const format = getColumnMetadataValue(column, 'num_format');
  return {
    locale: (format && localeMap.get(format)) ?? undefined,
    useGrouping: getUseGrouping(column),
    allowFloat: !ColumnIsInteger(column),
    allowNegative: true,
    minimumFractionDigits: getColumnMetadataValue(
      column,
      'num_min_frac_digits',
    ),
    maximumFractionDigits: getColumnMetadataValue(
      column,
      'num_max_frac_digits',
    ),
    currencySymbol: getColumnMetadataValue(column, 'mon_currency_symbol'),
    currencySymbolLocation: getColumnMetadataValue(
      column,
      'mon_currency_location',
    ),
  };
}

function getProps(column: Column): MoneyCellExternalProps {
  const formatterOptions = getFormatterOptions(column);
  const displayFormatter = new StringifiedNumberFormatter(formatterOptions);
  const insertCurrencySymbol = (() => {
    switch (formatterOptions.currencySymbolLocation) {
      case 'after-minus':
        return (s: string) =>
          s.replace(/^(-?)/, `$1${formatterOptions.currencySymbol}`);
      case 'end-with-space':
        return (s: string) => `${s} ${formatterOptions.currencySymbol}`;
      default:
        return (s: string) => s;
    }
  })();
  return {
    formatterOptions,
    formatForDisplay: (
      v: string | number | null | undefined,
    ): string | null | undefined => {
      if (!isDefinedNonNullable(v)) {
        return v;
      }
      return insertCurrencySymbol(displayFormatter.format(String(v)));
    },
  };
}

const moneyType: CellComponentFactory = {
  get(column: Column): ComponentAndProps<MoneyCellExternalProps> {
    return {
      component: MoneyCell,
      props: getProps(column),
    };
  },

  getInput(
    column: Column,
  ): ComponentAndProps<MoneyCellExternalProps['formatterOptions']> {
    return {
      component: MoneyCellInput,
      props: {
        ...getFormatterOptions(column),
        maximumFractionDigits: undefined,
      },
    };
  },

  getDisplayFormatter(column: Column) {
    return (v) => getProps(column).formatForDisplay(String(v));
  },
};

export default moneyType;
