import type { NumberDisplayOptions } from '@mathesar/api/tables/columns';
import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import NumberCell from './components/number/NumberCell.svelte';
import type { NumberCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

export interface NumberLikeColumn extends Column {
  display_options: Partial<NumberDisplayOptions> | null;
}

const numberType: CellComponentFactory = {
  get(column: NumberLikeColumn): ComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: {
        format: column.display_options?.number_format ?? null,
        isPercentage: column.display_options?.show_as_percentage ?? false,
      },
    };
  },
};

export default numberType;
