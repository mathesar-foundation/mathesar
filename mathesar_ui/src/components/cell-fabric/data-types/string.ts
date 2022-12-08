import type { TextTypeOptions } from '@mathesar/api/types/tables/columns';
import type {
  ComponentAndProps,
  TextInputProps,
} from '@mathesar-component-library/types';
import {
  TextInput,
  TextArea,
  optionalNonNullable,
} from '@mathesar-component-library';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import TextAreaCell from './components/textarea/TextAreaCell.svelte';
import type {
  TextBoxCellExternalProps,
  TextAreaCellExternalProps,
} from './components/typeDefinitions';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';

export interface StringLikeColumn extends CellColumnLike {
  type_options: Partial<TextTypeOptions> | null;
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
  getInput: (
    column: StringLikeColumn,
    config?: { multiLine?: boolean },
  ): ComponentAndProps<TextInputProps> => {
    const component = config?.multiLine ? TextArea : TextInput;
    return {
      component,
      props: {
        maxlength: optionalNonNullable(column.type_options?.length),
      },
    };
  },
};

export default stringType;
