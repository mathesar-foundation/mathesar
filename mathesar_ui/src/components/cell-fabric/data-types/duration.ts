import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import {
  DurationFormatter,
  DurationSpecification,
} from '@mathesar/utils/duration';
import {
  FormattedInput,
  isDefinedNonNullable,
} from '@mathesar-component-library';
import type {
  ComponentAndProps,
  FormattedInputProps,
} from '@mathesar-component-library/types';

import FormattedInputCell from './components/formatted-input/FormattedInputCell.svelte';
import type { FormattedInputCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

function getProps(
  column: RawColumnWithMetadata,
): FormattedInputCellExternalProps {
  const defaults = DurationSpecification.getDefaults();
  const max = column.metadata?.duration_max ?? defaults.max;
  const min = column.metadata?.duration_min ?? defaults.min;
  const durationSpecification = new DurationSpecification({ max, min });
  const formatter = new DurationFormatter(durationSpecification);
  return {
    useTabularNumbers: true,
    formatter,
    placeholder: durationSpecification.getFormattingString(),
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

const durationType: CellComponentFactory = {
  get: (
    column: RawColumnWithMetadata,
  ): ComponentAndProps<FormattedInputCellExternalProps> => ({
    component: FormattedInputCell,
    props: getProps(column),
  }),
  getInput: (
    column: RawColumnWithMetadata,
  ): ComponentAndProps<FormattedInputProps<string>> => ({
    component: FormattedInput,
    props: getProps(column),
  }),
  getDisplayFormatter(column: RawColumnWithMetadata) {
    return (v) => getProps(column).formatForDisplay(String(v));
  },
};

export default durationType;
