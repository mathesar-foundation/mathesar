import { type Column, getColumnDisplayOption } from '@mathesar/api/rpc/columns';
import { Select, isDefinedNonNullable } from '@mathesar-component-library';
import type {
  ComponentAndProps,
  SelectProps,
} from '@mathesar-component-library/types';

import CheckboxCell from './components/checkbox/CheckboxCell.svelte';
import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type {
  CheckBoxCellExternalProps,
  SingleSelectCellExternalProps,
} from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

type Props =
  | CheckBoxCellExternalProps
  | SingleSelectCellExternalProps<boolean | null>;

interface BooleanLabels {
  true: string;
  false: string;
}

function getLabels(column: Column): BooleanLabels {
  return {
    true: getColumnDisplayOption(column, 'bool_true'),
    false: getColumnDisplayOption(column, 'bool_false'),
  };
}

function getFormattedValue(
  labels: BooleanLabels,
  value?: boolean | null,
): string {
  if (isDefinedNonNullable(value)) {
    return value ? labels.true : labels.false;
  }
  return '';
}

function getProps(
  column: Column,
): SingleSelectCellExternalProps<boolean | null> {
  const labels = getLabels(column);
  return {
    options: [null, true, false],
    getLabel: (value?: boolean | null) => getFormattedValue(labels, value),
  };
}

const booleanType: CellComponentFactory = {
  initialInputValue: null,
  get: (column: Column): ComponentAndProps<Props> => {
    const displayOptions = column.display_options ?? undefined;
    if (displayOptions && displayOptions.bool_input === 'dropdown') {
      return {
        component: SingleSelectCell,
        props: getProps(column),
      };
    }
    return { component: CheckboxCell, props: {} };
  },
  getInput: (
    column: Column,
  ): ComponentAndProps<SelectProps<boolean | null>> => ({
    component: Select,
    props: getProps(column),
  }),
  getDisplayFormatter(column: Column) {
    const labels = getLabels(column);
    return (value: unknown) => {
      if (value === null || value === undefined || typeof value === 'boolean') {
        return getFormattedValue(labels, value);
      }
      return '';
    };
  },
};

export default booleanType;
