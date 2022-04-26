import type { Column } from '@mathesar/stores/table-data/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import TextAreaCell from './components/textarea/TextAreaCell.svelte';
import type {
  TextBoxCellExternalProps,
  TextAreaCellExternalProps,
} from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

export interface StringLikeColumn extends Column {
  type_options: {
    length?: number | null;
  } | null;
}

const stringType: CellComponentFactory = {
  get: (
    column: StringLikeColumn,
    config?: { multiLine?: boolean },
  ): ComponentAndProps<
    TextBoxCellExternalProps | TextAreaCellExternalProps
  > => {
    const typeOptions = column.type_options ?? {};
    const component = config?.multiLine ? TextAreaCell : TextBoxCell;
    return { component, props: typeOptions };
  },
};

export default stringType;
