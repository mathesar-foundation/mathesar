import type {
  NumberColumn,
  NumberDisplayOptions,
  NumberFormat,
} from '@mathesar/api/tables/columns';
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

function getUseGrouping(
  apiUseGrouping: NumberDisplayOptions['use_grouping'],
): NumberCellExternalProps['useGrouping'] {
  switch (apiUseGrouping) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'auto':
    default:
      return 'auto';
  }
}

function getProps(
  column: NumberColumn,
  config?: Config,
): NumberCellExternalProps {
  const format = column.display_options?.number_format ?? null;
  const props = {
    locale: (format && localeMap.get(format)) ?? undefined,
    useGrouping: getUseGrouping(column.display_options?.use_grouping ?? 'auto'),
    allowFloat: getAllowFloat(column, config?.floatAllowanceStrategy),
  };
  return props;
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
  ): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCellInput,
      props: getProps(column, config),
    };
  },
};

export default numberType;
