import { Select } from '@mathesar/component-library';
import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type { CellComponentFactory } from './typeDefinitions';
import { type RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type {
  SingleSelectCellExternalProps,
} from './components/typeDefinitions';

function getProps(
  column: RawColumnWithMetadata,
): SingleSelectCellExternalProps<string | null> {
  const labels : unknown[] | null = column.enum_values;
  return {
    options: labels ? [...labels] : [],
    getLabel: (value?: string | null) => value ?? '',
  };
}

const enumType: CellComponentFactory = {
  initialInputValue: undefined,
  get: (
    column: RawColumnWithMetadata
  ): ReturnType<CellComponentFactory['get']> => {
    return {
      component: SingleSelectCell,
      props: getProps(column),
    };
  },
  getInput: (
    column: RawColumnWithMetadata,
  ): ReturnType<CellComponentFactory['getInput']> => {
    return {
      component: Select,
      props: getProps(column),
    };
  },
  getDisplayFormatter: () => String,
};

export default enumType;
