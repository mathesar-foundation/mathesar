import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import { UriFormatter } from '../../../utils/uri/UriFormatter';
import type { CellComponentFactory } from './typeDefinitions';

const uriType: CellComponentFactory = {
  get: (
    column: RawColumnWithMetadata
  ): ComponentAndProps<any> => ({
    component: TextBoxCell,
    props: {},
  }),

  getInput: (
    column: RawColumnWithMetadata
  ): ComponentAndProps<any> => ({
    component: FormattedInput,
    props: {
      formatter: new UriFormatter(),
      placeholder: 'Enter URI',
    },
  }),

  getDisplayFormatter: () => String,
};

export default uriType;