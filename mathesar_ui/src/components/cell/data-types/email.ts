import type { ComponentAndProps } from '@mathesar-component-library/types';
import { TextInput } from '@mathesar-component-library';
import type { CellComponentFactory } from './typeDefinitions';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';

const emailType: CellComponentFactory = {
  get: (): ComponentAndProps => ({ component: TextBoxCell }),

  getInput: (): ComponentAndProps => ({ component: TextInput }),
};

export default emailType;
