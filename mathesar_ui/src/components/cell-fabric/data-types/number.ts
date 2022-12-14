import type {
  NumberColumn,
  NumberDisplayOptions,
  NumberFormat,
} from '@mathesar/api/types/tables/columns';
import { StringifiedNumberFormatter } from '@mathesar-component-library';
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
  column: NumberColumn,
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
  apiUseGrouping: NumberDisplayOptions['use_grouping'],
): NumberCellExternalProps['formatterOptions']['useGrouping'] {
  switch (apiUseGrouping) {
    case 'true':
      return true;
    case 'false':
    default:
      return false;
  }
}

function getInputProps(
  column: NumberColumn,
  config?: Config,
): Omit<NumberCellExternalProps, 'displayFormatter'> {
  const displayOptions = column.display_options;
  const format = displayOptions?.number_format ?? null;
  const locale = (format && localeMap.get(format)) ?? undefined;
  const useGrouping = getUseGrouping(displayOptions?.use_grouping ?? 'false');
  const allowFloat = getAllowFloat(column, config?.floatAllowanceStrategy);
  const allowNegative = true;
  const minimumFractionDigits =
    displayOptions?.minimum_fraction_digits ?? undefined;
  return {
    formatterOptions: {
      locale,
      allowFloat,
      allowNegative,
      useGrouping,
      minimumFractionDigits,
    },
  };
}

function getProps(
  column: NumberColumn,
  config?: Config,
): NumberCellExternalProps {
  const props = getInputProps(column, config);
  const displayOptions = column.display_options;
  const maximumFractionDigits =
    displayOptions?.maximum_fraction_digits ?? undefined;
  const formatterOptions = {
    ...props.formatterOptions,
    // We only want to apply `maximumFractionDigits` during display. We don't
    // want it to take effect during input.
    maximumFractionDigits,
  };
  return {
    ...props,
    formatterOptions,
    displayFormatter: new StringifiedNumberFormatter(formatterOptions),
  };
}

const numberType: CellComponentFactory = {
  get(
    column: NumberColumn,
    config?: Config,
  ): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: getProps(column, config),
    };
  },

  getInput(
    column: NumberColumn,
    config?: Config,
  ): ComponentAndProps<Omit<NumberCellExternalProps, 'displayFormatter'>> {
    return {
      component: NumberCellInput,
      props: getInputProps(column, config),
    };
  },

  getDisplayFormatter(
    column: NumberColumn,
    config?: Config,
  ): (value: unknown) => string {
    const formatter = getProps(column, config).displayFormatter;
    return (value: unknown) => formatter.format(String(value));
  },
};

export default numberType;
