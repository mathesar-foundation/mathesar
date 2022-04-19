import type { Column } from '@mathesar/stores/table-data/types';
import CheckboxCell from './components/checkbox/CheckboxCell.svelte';
import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type {
  CellComponentAndProps,
  CheckBoxCellExternalProps,
  SingleSelectCellExternalProps,
} from './components/typeDefinitions';

export interface BooleanLikeColumn extends Column {
  display_options: {
    input?: 'checkbox' | 'dropdown' | null;
    custom_labels?: {
      TRUE: string;
      FALSE: string;
    } | null;
  } | null;
}

export default {
  get: (
    column: BooleanLikeColumn,
  ): CellComponentAndProps<
    CheckBoxCellExternalProps | SingleSelectCellExternalProps<boolean, string>
  > => {
    const displayOptions = column.display_options ?? undefined;
    if (displayOptions && displayOptions.input === 'dropdown') {
      const customLabels = displayOptions.custom_labels ?? undefined;
      const options = [
        customLabels?.TRUE ?? 'true',
        customLabels?.FALSE ?? 'false',
      ];
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
};
