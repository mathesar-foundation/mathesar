import type { NumberColumn, NumberFormat } from '@mathesar/api/tables/columns';
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

function numberColumnIsInteger(column: NumberColumn): boolean {
  switch (column.type) {
    case 'INTEGER':
    case 'BIGINT':
    case 'SMALLINT':
    case 'SERIAL':
    case 'BIGSERIAL':
    case 'SMALLSERIAL':
      return true;
    case 'DOUBLE PRECISION':
    case 'REAL':
      return false;
    case 'DECIMAL':
    case 'NUMERIC':
      return (column.type_options?.scale ?? Infinity) === 0;
    default:
      return false;
  }
}

function getProps(column: NumberColumn): NumberCellExternalProps {
  const format = column.display_options?.number_format ?? null;
  const props = {
    locale: (format && localeMap.get(format)) ?? undefined,
    isPercentage: column.display_options?.show_as_percentage ?? false,
    allowFloat: !numberColumnIsInteger(column),
  };
  return props;
}

const numberType: CellComponentFactory = {
  get(column: NumberColumn): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: getProps(column),
    };
  },

  /**
   * This should ideally return `StringifiedNumberInput` with props But since we
   * require additional operations like `isPercentage`, it's better to use a
   * dedicated `NumberCellInput` component.
   */
  getInput(column: NumberColumn): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCellInput,
      props: getProps(column),
    };
  },
};

export default numberType;
