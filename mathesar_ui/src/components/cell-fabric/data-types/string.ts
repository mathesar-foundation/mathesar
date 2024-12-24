import type { Column } from '@mathesar/api/rpc/columns';
import GrowableTextArea from '@mathesar/components/GrowableTextArea.svelte';
import { TextInput, optionalNonNullable } from '@mathesar-component-library';
import type {
  ComponentAndProps,
  TextInputProps,
} from '@mathesar-component-library/types';

import TextAreaCell from './components/textarea/TextAreaCell.svelte';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import type {
  TextAreaCellExternalProps,
  TextBoxCellExternalProps,
} from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

const stringType: CellComponentFactory = {
  initialInputValue: '',
  get: (
    column: Column,
    config?: { multiLine?: boolean },
  ): ComponentAndProps<
    TextBoxCellExternalProps | TextAreaCellExternalProps
  > => {
    const typeOptions = column.type_options ?? {};
    const component = config?.multiLine ? TextAreaCell : TextBoxCell;
    return { component, props: typeOptions };
  },
  getInput: (
    column: Column,
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
  getFilterInput: (column: Column): ComponentAndProps<TextInputProps> => ({
    component: TextInput,
    props: {
      maxlength: optionalNonNullable(column.type_options?.length),
    },
  }),
  getDisplayFormatter: () => String,
};

export default stringType;
