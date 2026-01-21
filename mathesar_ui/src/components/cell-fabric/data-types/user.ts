import { getMetadataValue } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import UserCell from './components/user/UserCell.svelte';
import UserFilterInput from './components/user/UserFilterInput.svelte';
import UserInput from './components/user/UserInput.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const userType: CellComponentFactory = {
  initialInputValue: null,
  get: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserCell,
    props: {
      userDisplayField: getMetadataValue(column.metadata, 'user_display_field'),
    },
  }),
  getInput: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'username',
    },
  }),
  getSimpleInput: (column: RawColumnWithMetadata): ComponentAndProps => ({
    component: UserFilterInput,
    props: {
      userDisplayField:
        getMetadataValue(column.metadata, 'user_display_field') ?? 'username',
    },
  }),
  getDisplayFormatter: () => String,
};

export default userType;
