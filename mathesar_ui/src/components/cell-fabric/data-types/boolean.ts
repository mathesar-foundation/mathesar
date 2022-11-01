import type { BooleanDisplayOptions } from '@mathesar/api/tables/columns';
import type {
  ComponentAndProps,
  SelectProps,
} from '@mathesar-component-library/types';
import { Select, isDefinedNonNullable } from '@mathesar-component-library';
import CheckboxCell from './components/checkbox/CheckboxCell.svelte';
import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type {
  CheckBoxCellExternalProps,
  SingleSelectCellExternalProps,
} from './components/typeDefinitions';
import type { CellComponentFactory, CellColumnLike } from './typeDefinitions';

export interface BooleanLikeColumn extends CellColumnLike {
  display_options: Partial<BooleanDisplayOptions> | null;
}

type Props =
  | CheckBoxCellExternalProps
  | SingleSelectCellExternalProps<boolean | null>;

function getLabels(
  displayOptions?: BooleanLikeColumn['display_options'],
): [string, string] {
  const customLabels = displayOptions?.custom_labels ?? undefined;
  return [customLabels?.TRUE ?? 'true', customLabels?.FALSE ?? 'false'];
}

function getProps(
  column: BooleanLikeColumn,
): SingleSelectCellExternalProps<boolean | null> {
  const labels = getLabels(column.display_options);
  return {
    options: [null, true, false],
    getLabel: (value?: boolean | null) => {
      if (isDefinedNonNullable(value)) {
        return value ? labels[0] : labels[1];
      }
      return '';
    },
  };
}

const booleanType: CellComponentFactory = {
  get: (column: BooleanLikeColumn): ComponentAndProps<Props> => {
    const displayOptions = column.display_options ?? undefined;
    if (displayOptions && displayOptions.input === 'dropdown') {
      return {
        component: SingleSelectCell,
        props: getProps(column),
      };
    }
    return { component: CheckboxCell, props: {} };
  },
  getInput: (
    column: BooleanLikeColumn,
  ): ComponentAndProps<SelectProps<boolean | null>> => ({
    component: Select,
    props: getProps(column),
  }),
};

export default booleanType;
