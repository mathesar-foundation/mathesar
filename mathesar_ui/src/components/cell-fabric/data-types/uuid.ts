import {
  FormattedInput,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import FormattedInputCell from './components/formatted-input/FormattedInputCell.svelte';
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

const uuidType: CellComponentFactory = {
  initialInputValue: '',
  get: (): ComponentAndProps => ({
    component: FormattedInputCell,
    props: getProps(),
  }),
  getInput: (): ComponentAndProps => ({
    component: FormattedInput,
    props: getProps(),
  }),
  getDisplayFormatter() {
    return (v) => getProps().formatForDisplay(String(v));
  },
};

export default uuidType;
