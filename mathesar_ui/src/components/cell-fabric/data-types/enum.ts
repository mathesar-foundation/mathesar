import { Select } from '@mathesar/component-library';
import SingleSelectCell from './components/select/SingleSelectCell.svelte';
import type { CellColumnLike, CellComponentFactory } from './typeDefinitions';

const enumType: CellComponentFactory = {
  initialInputValue: undefined,
  get: (
    column: CellColumnLike,
    config?: { enumValues?: unknown[] },
  ): ReturnType<CellComponentFactory['get']> => {
    const enumValues = (config?.enumValues ?? []) as string[];
    return {
      component: SingleSelectCell,
      props: {
        options: enumValues,
        getLabel: (option?: string) => option ?? '',
      },
    };
  },
  getInput: (
    column: CellColumnLike,
    config?: { enumValues?: unknown[] },
  ): ReturnType<CellComponentFactory['getInput']> => {
    const enumValues = (config?.enumValues ?? []) as string[];
    return {
      component: Select,
      props: {
        options: enumValues,
        getLabel: (option?: string) => option ?? '',
        isActive: true,
      },
    };
  },
  getDisplayFormatter: () => String,
};

export default enumType;
