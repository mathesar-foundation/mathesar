import type { NumberFormat } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import {
  type RawColumnWithMetadata,
  getColumnMetadataValue,
} from '@mathesar/api/rpc/columns';
import {
  StringifiedNumberFormatter,
  assertExhaustive,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import NumberCell from './components/number/NumberCell.svelte';
import NumberCellInput from './components/number/NumberCellInput.svelte';
import type { NumberCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

// prettier-ignore
const localeMap = new Map<NumberFormat, string>([
  ['english' , 'en'    ],
  ['german'  , 'de'    ],
  ['french'  , 'fr'    ],
  ['hindi'   , 'hi'    ],
  ['swiss'   , 'de-CH' ],
]);

/**
 * The strategy for determining the `allowFloat` prop, based on the column's
 * type_options.
 */
type FloatAllowanceStrategy = 'always' | 'never' | 'scale-based';

interface Config extends Record<string, unknown> {
  floatAllowanceStrategy: FloatAllowanceStrategy;
}

function getAllowFloat(
  column: RawColumnWithMetadata,
  floatAllowanceStrategy?: FloatAllowanceStrategy,
): boolean {
  if (floatAllowanceStrategy === 'scale-based') {
    return (column.type_options?.scale ?? Infinity) !== 0;
  }
  if (floatAllowanceStrategy === 'never') {
    return false;
  }
  return true;
}

export function getUseGrouping(
  column: RawColumnWithMetadata,
): NumberCellExternalProps['formatterOptions']['useGrouping'] {
  const grouping = getColumnMetadataValue(column, 'num_grouping');
  switch (grouping) {
    case 'always':
      return 'always';
    case 'auto':
      return 'auto';
    case 'never':
      return false;
    default:
      return assertExhaustive(grouping);
  }
}

function getFormatterOptions(
  column: RawColumnWithMetadata,
  config?: Config,
): NumberCellExternalProps['formatterOptions'] {
  const displayOptions = column.metadata;
  const format = displayOptions?.num_format ?? null;
  const locale = (format && localeMap.get(format)) ?? undefined;
  const useGrouping = getUseGrouping(column);
  const allowFloat = getAllowFloat(column, config?.floatAllowanceStrategy);
  const allowNegative = true;
  const minimumFractionDigits =
    displayOptions?.num_min_frac_digits ?? undefined;
  return {
    locale,
    allowFloat,
    allowNegative,
    useGrouping,
    minimumFractionDigits,
  };
}

function getProps(
  column: RawColumnWithMetadata,
  config?: Config,
): NumberCellExternalProps {
  const basicFormatterOptions = getFormatterOptions(column, config);
  const displayOptions = column.metadata;
  const maximumFractionDigits =
    displayOptions?.num_max_frac_digits ?? undefined;
  const formatterOptions = {
    ...basicFormatterOptions,
    // We only want to apply `maximumFractionDigits` during display. We don't
    // want it to take effect during input.
    maximumFractionDigits,
  };
  const displayFormatter = new StringifiedNumberFormatter(formatterOptions);
  return {
    formatterOptions,
    formatForDisplay: (
      v: string | number | null | undefined,
    ): string | null | undefined => {
      if (!isDefinedNonNullable(v)) {
        return v;
      }
      return displayFormatter.format(String(v));
    },
  };
}

const numberType: CellComponentFactory = {
  get(
    column: RawColumnWithMetadata,
    config?: Config,
  ): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: getProps(column, config),
    };
  },

  getInput(
    column: RawColumnWithMetadata,
    config?: Config,
  ): ComponentAndProps<NumberCellExternalProps['formatterOptions']> {
    return {
      component: NumberCellInput,
      props: getFormatterOptions(column, config),
    };
  },

  getDisplayFormatter(column: RawColumnWithMetadata, config?: Config) {
    return (v) => getProps(column, config).formatForDisplay(String(v));
  },
};

export default numberType;
