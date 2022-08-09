import { FormattedInput } from '@mathesar-component-library';
import type {
  ComponentAndProps,
  FormattedInputProps,
} from '@mathesar-component-library/types';
import type { DurationDisplayOptions } from '@mathesar/api/tables/columns';
import {
  DurationFormatter,
  DurationSpecification,
} from '@mathesar/utils/duration';
import FormattedInputCell from './components/formatted-input/FormattedInputCell.svelte';
import type { FormattedInputCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';

export interface DurationLikeColumn extends CellColumnLike {
  display_options: Partial<DurationDisplayOptions> | null;
}

function getProps(column: DurationLikeColumn): FormattedInputCellExternalProps {
  const defaults = DurationSpecification.getDefaults();
  const max = column.display_options?.max ?? defaults.max;
  const min = column.display_options?.min ?? defaults.min;
  const durationSpecification = new DurationSpecification({ max, min });
  const formatter = new DurationFormatter(durationSpecification);
  return {
    formatter,
    placeholder: durationSpecification.getFormattingString(),
  };
}

const durationType: CellComponentFactory = {
  get: (
    column: DurationLikeColumn,
  ): ComponentAndProps<FormattedInputCellExternalProps> => ({
    component: FormattedInputCell,
    props: getProps(column),
  }),
  getInput: (
    column: DurationLikeColumn,
  ): ComponentAndProps<FormattedInputProps<string>> => ({
    component: FormattedInput,
    props: getProps(column),
  }),
};

export default durationType;
