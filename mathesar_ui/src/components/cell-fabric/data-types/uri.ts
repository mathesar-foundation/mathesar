import type { ComponentAndProps } from '@mathesar-component-library/types';
import { TextInput } from '@mathesar-component-library';
import UriCell from './components/uri/UriCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const uriType: CellComponentFactory = {
  initialInputValue: '',
  get: (): ComponentAndProps => ({ component: UriCell }),
  getInput: (): ComponentAndProps => ({ component: TextInput }),
};

export default uriType;
