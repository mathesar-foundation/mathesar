import { FormattedInput } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import UriCell from './components/uri/UriCell.svelte';
import { UriFormatter } from '../../../utils/uri/UriFormatter';

import type { CellComponentFactory } from './typeDefinitions';

const uriType: CellComponentFactory = {
  get: (): ComponentAndProps => ({ component: UriCell }),
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
