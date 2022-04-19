import type { NumberDisplayOptions } from '@mathesar/api/tables/columns';
import type { Column } from '@mathesar/stores/table-data/types';
import NumberCell from './components/number/NumberCell.svelte';
import type {
  CellComponentAndProps,
  NumberCellExternalProps,
} from './components/typeDefinitions';

export interface NumberLikeColumn extends Column {
  display_options: Partial<NumberDisplayOptions> | null;
}

export default {
  get(
    column: NumberLikeColumn,
  ): CellComponentAndProps<NumberCellExternalProps> {
    return {
      component: NumberCell,
      props: {
        format: column.display_options?.number_format ?? null,
        isPercentage: column.display_options?.show_as_percentage ?? false,
      },
    };
  },
};
