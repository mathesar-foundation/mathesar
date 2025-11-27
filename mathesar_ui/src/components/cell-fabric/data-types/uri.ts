import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import { UriFormatter } from '../../../utils/uri/UriFormatter';

import TextBoxCell from './components/textbox/TextBoxCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';

const uriType: CellComponentFactory = {
  get: (): ComponentAndProps => ({
    component: TextBoxCell,
    props: {},
  }),

  getInput: (): ComponentAndProps => ({
    component: FormattedInput,
    props: {
      formatter: new UriFormatter(),
      placeholder: 'Enter URI',
    },
  }),

  getDisplayFormatter: () => (v) => String(v),
};

export default uriType;
