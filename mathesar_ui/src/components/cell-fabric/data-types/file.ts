import { TextInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import FileCell from './components/file/FileCell.svelte';
import FileInput from './components/file/FileInput.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const fileType: CellComponentFactory = {
  initialInputValue: '',
  get: (): ComponentAndProps => ({ component: FileCell }),
  getInput: (): ComponentAndProps => ({ component: FileInput }),
  getSimpleInput: (): ComponentAndProps => ({ component: TextInput }),
  getDisplayFormatter: () => String,
};

export default fileType;
