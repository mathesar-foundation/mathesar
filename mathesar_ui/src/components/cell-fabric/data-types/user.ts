import { TextInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import UserCell from './components/user/UserCell.svelte';
import UserInput from './components/user/UserInput.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const userType: CellComponentFactory = {
  initialInputValue: null,
  get: (): ComponentAndProps => ({ component: UserCell }),
  getInput: (): ComponentAndProps => ({ component: UserInput }),
  getSimpleInput: (): ComponentAndProps => ({ component: TextInput }),
  getDisplayFormatter: () => String,
};

export default userType;
