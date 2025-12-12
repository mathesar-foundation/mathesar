import { TextInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import UriCell from './components/uri/UriCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const uriType: CellComponentFactory = {
  initialInputValue: '',
  get: (): ComponentAndProps => ({ component: UriCell }),
  getInput: (): ComponentAndProps => ({ component: TextInput }),
  getDisplayFormatter: () => String,
};

export default uriType;
