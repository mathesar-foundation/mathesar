import type { DbType } from '@mathesar/AppTypes';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import { TextInput, isDefinedNonNullable } from '@mathesar-component-library';
import ArrayCell from './components/array/ArrayCell.svelte';
import type { ArrayCellExternalProps } from './components/typeDefinitions';
import type {
  SimpleCellDataTypes,
  CellComponentFactory,
  CellColumnLike,
} from './typeDefinitions';
import { getCellInfo, getCellConfiguration } from './utils';

export interface ArrayLikeColumn extends CellColumnLike {
  type_options: {
    item_type: DbType;
  } | null;
  display_options: Record<string, never> | null;
}

const arrayType: (
  simpleDataTypeComponentFactories: Record<
    SimpleCellDataTypes,
    CellComponentFactory
  >,
) => CellComponentFactory = (simpleDataTypeComponentFactories) => ({
  get: (column: ArrayLikeColumn): ComponentAndProps<ArrayCellExternalProps> => {
    const itemDbType = column.type_options?.item_type ?? 'string';
    const cellInfo = getCellInfo(itemDbType);
    const config = getCellConfiguration(itemDbType, cellInfo);
    const elementDataType =
      !cellInfo || cellInfo.type === 'array' ? 'string' : cellInfo.type;
    const elementCellFactory =
      simpleDataTypeComponentFactories[elementDataType];
    return {
      component: ArrayCell,
      props: {
        formatElementForDisplay: (
          v: never | null | undefined,
        ): string | null | undefined => {
          if (!isDefinedNonNullable(v)) {
            return v;
          }
          if (elementCellFactory.getDisplayFormatter) {
            return elementCellFactory.getDisplayFormatter(
              {
                type: itemDbType,
                type_options: null,
                display_options: column.display_options,
              },
              config,
            )(v);
          }
          return String(v);
        },
      },
    };
  },
  getInput: (): ComponentAndProps => ({ component: TextInput }),
});

export default arrayType;
