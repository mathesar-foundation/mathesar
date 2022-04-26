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
  | SingleSelectCellExternalProps<boolean, string>;

function getLabels(
  displayOptions?: BooleanLikeColumn['display_options'],
): [string, string] {
  const customLabels = displayOptions?.custom_labels ?? undefined;
  return [customLabels?.TRUE ?? 'true', customLabels?.FALSE ?? 'false'];
}

const booleanType: CellComponentFactory = {
  get: (column: BooleanLikeColumn): ComponentAndProps<Props> => {
    const displayOptions = column.display_options ?? undefined;
    if (displayOptions && displayOptions.input === 'dropdown') {
      const options = getLabels(displayOptions);
      const getSelectedOptionsFromValue = (
        value: boolean | undefined | null,
      ): string[] => {
        if (value === true) {
          return [options[0]];
        }
        if (value === false) {
          return [options[1]];
        }
        return [];
      };
      const getValueFromSelectedOptions = (
        values: string[],
      ): boolean | null => {
        let value = null;
        switch (values[0]) {
          case options[0]:
            value = true;
            break;
          case options[1]:
            value = false;
            break;
          default:
            break;
        }
        return value;
      };
      const getValueLabel = (value: boolean) =>
        value ? options[0] : options[1];

      return {
        component: SingleSelectCell,
        props: {
          options,
          getSelectedOptionsFromValue,
          getValueFromSelectedOptions,
          getValueLabel,
        },
      };
    }
    return { component: CheckboxCell, props: {} };
  },
  getInput: (
    column: BooleanLikeColumn,
  ): ComponentAndProps<SelectProps<boolean>> => {
    const labels = getLabels(column.display_options);
    return {
      component: Select,
      props: {
        options: [true, false],
        getLabel: (value?: boolean) => {
          if (isDefinedNonNullable(value)) {
            return value ? labels[0] : labels[1];
          }
          return '';
        },
      },
    };
  },
};

export default booleanType;
