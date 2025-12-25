import {
  FormattedInput,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import UriCell from './components/uri/UriCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';
import { SpecialStringFormatter } from './utils';

function getProps() {
  const formatter = SpecialStringFormatter;
  return {
    formatter,
    formatForDisplay: (
      v: string | null | undefined,
    ): string | null | undefined => {
      if (!isDefinedNonNullable(v)) {
        return v;
      }
      return formatter.format(v);
    },
  };
}

const uriType: CellComponentFactory = {
  initialInputValue: '',
  get: (): ComponentAndProps => ({ component: UriCell, props: getProps() }),
  getInput: (): ComponentAndProps => ({
    component: FormattedInput,
    props: getProps(),
  }),
  getDisplayFormatter() {
    return (v) => getProps().formatForDisplay(String(v));
  },
};

export default uriType;
