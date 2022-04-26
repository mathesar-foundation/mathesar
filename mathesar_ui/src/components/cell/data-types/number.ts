import type {
  NumberDisplayOptions,
  NumberFormat,
} from '@mathesar/api/tables/columns';
import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import NumberCell from './components/number/NumberCell.svelte';
import NumberCellInput from './components/number/NumberCellInput.svelte';
import type { NumberCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

export interface NumberLikeColumn extends Column {
  display_options: Partial<NumberDisplayOptions> | null;
}

// prettier-ignore
const localeMap = new Map<NumberFormat, string>([
  ['english' , 'en'    ],
  ['german'  , 'de'    ],
  ['french'  , 'fr'    ],
  ['hindi'   , 'hi'    ],
  ['swiss'   , 'de-CH' ],
]);

function getProps(column: NumberLikeColumn): NumberCellExternalProps {
  const format = column.display_options?.number_format ?? null;
  return {
    locale: (format && localeMap.get(format)) ?? undefined,
    isPercentage: column.display_options?.show_as_percentage ?? false,
  };
}

const numberType: CellComponentFactory = {
  get(column: NumberLikeColumn): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: getProps(column),
    };
  },
  // This should ideally return StringifiedNumberInput with props
  // But since we require addional operations like isPercentage, it's
  // better to use a dedicated NumberCellInput component
  getInput(
    column: NumberLikeColumn,
  ): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCellInput,
      props: getProps(column),
    };
  },
};

export default numberType;
