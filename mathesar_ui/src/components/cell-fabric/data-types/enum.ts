import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import { Select } from '@mathesar/component-library';

import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type { SingleSelectCellExternalProps } from './components/typeDefinitions';
import type { CellComponentFactory } from './typeDefinitions';

function getProps(
  column: RawColumnWithMetadata,
): SingleSelectCellExternalProps<string | null> {
  return {
    autoSelect: 'none',
    options: [
      ...(column.nullable ? [null] : []),
      ...(column.type_options?.enum_values ?? []),
    ],
    getLabel: (value?: string | null) => value ?? '',
  };
}

const enumType: CellComponentFactory = {
  initialInputValue: undefined,
  get: (
    column: RawColumnWithMetadata,
  ): ReturnType<CellComponentFactory['get']> => ({
    component: SingleSelectCell,
    props: getProps(column),
  }),
  getInput: (
    column: RawColumnWithMetadata,
  ): ReturnType<CellComponentFactory['getInput']> => ({
    component: Select,
    props: getProps(column),
  }),
  getDisplayFormatter: () => String,
};

export default enumType;
