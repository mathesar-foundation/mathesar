import { TextInput, optionalNonNullable } from '@mathesar-component-library';
import type {
  ComponentAndProps,
  TextInputProps,
} from '@mathesar-component-library/types';
import type { TextTypeOptions } from '@mathesar/api/rest/types/tables/columns';
import GrowableTextArea from '@mathesar/components/GrowableTextArea.svelte';
import TextAreaCell from './components/textarea/TextAreaCell.svelte';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import type {
  TextAreaCellExternalProps,
  TextBoxCellExternalProps,
} from './components/typeDefinitions';
import type { CellColumnLike, CellComponentFactory } from './typeDefinitions';

export interface StringLikeColumn extends CellColumnLike {
  type_options: Partial<TextTypeOptions> | null;
}

const stringType: CellComponentFactory = {
  initialInputValue: '',
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
    const component = config?.multiLine ? GrowableTextArea : TextInput;
    return {
      component,
      props: {
        maxlength: optionalNonNullable(column.type_options?.length),
      },
    };
  },
  getDisplayFormatter: () => String,
};

export default stringType;
