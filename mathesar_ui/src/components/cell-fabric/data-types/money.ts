import {
  StringifiedNumberFormatter,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type {
  MoneyColumn,
  NumberFormat,
} from '@mathesar/api/types/tables/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import MoneyCell from './components/money/MoneyCell.svelte';
import MoneyCellInput from './components/money/MoneyCellInput.svelte';
import type {
  MoneyCellExternalProps,
  CellValueFormatter,
} from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';
import { getUseGrouping } from './number';

// Values to use if for some reason we don't get them from the API.
const FALLBACK_CURRENCY_SYMBOL = '$';
const FALLBACK_CURRENCY_SYMBOL_LOCATION = 'after-minus';

// prettier-ignore
const localeMap = new Map<NumberFormat, string>([
  ['english' , 'en'    ],
  ['german'  , 'de'    ],
  ['french'  , 'fr'    ],
  ['hindi'   , 'hi'    ],
  ['swiss'   , 'de-CH' ],
]);

function moneyColumnIsInteger(column: MoneyColumn): boolean {
  return (column.type_options?.scale ?? Infinity) === 0;
}

function getFormatterOptions(
  column: MoneyColumn,
): MoneyCellExternalProps['formatterOptions'] {
  const displayOptions = column.display_options;
  const format = displayOptions?.number_format ?? null;
  return {
    locale: (format && localeMap.get(format)) ?? undefined,
    useGrouping: getUseGrouping(displayOptions?.use_grouping ?? 'true'),
    allowFloat: !moneyColumnIsInteger(column),
    minimumFractionDigits: displayOptions?.minimum_fraction_digits ?? undefined,
    maximumFractionDigits: displayOptions?.maximum_fraction_digits ?? undefined,
    currencySymbol: displayOptions?.currency_symbol ?? FALLBACK_CURRENCY_SYMBOL,
    currencySymbolLocation:
      displayOptions?.currency_symbol_location ??
      FALLBACK_CURRENCY_SYMBOL_LOCATION,
  };
}

function getProps(column: MoneyColumn): MoneyCellExternalProps {
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
  get(column: MoneyColumn): ComponentAndProps<MoneyCellExternalProps> {
    return {
      component: MoneyCell,
      props: getProps(column),
    };
  },

  getInput(
    column: MoneyColumn,
  ): ComponentAndProps<MoneyCellExternalProps['formatterOptions']> {
    return {
      component: MoneyCellInput,
      props: {
        ...getFormatterOptions(column),
        maximumFractionDigits: undefined,
      },
    };
  },

  getDisplayFormatter(column: MoneyColumn): CellValueFormatter<string> {
    return getProps(column).formatForDisplay;
  },
};

export default moneyType;
