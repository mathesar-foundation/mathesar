import type { Column } from '@mathesar/stores/table-data/types';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import TextAreaCell from './components/textarea/TextAreaCell.svelte';
import type {
  CellComponentAndProps,
  TextBoxCellExternalProps,
  TextAreaCellExternalProps,
} from './components/typeDefinitions';

export interface StringLikeColumn extends Column {
  type_options: {
    length?: number | null;
  } | null;
}

export default {
  get: (
    column: StringLikeColumn,
    config?: { multiLine?: boolean },
  ): CellComponentAndProps<
    TextBoxCellExternalProps | TextAreaCellExternalProps
  > => {
    const typeOptions = column.type_options ?? {};
    const component = config?.multiLine ? TextAreaCell : TextBoxCell;
    return { component, props: typeOptions };
  },
};
