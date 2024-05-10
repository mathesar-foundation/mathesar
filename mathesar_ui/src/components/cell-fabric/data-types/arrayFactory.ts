import type { DbType } from '@mathesar/AppTypes';
import { TextInput, isDefinedNonNullable } from '@mathesar-component-library';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import ArrayCell from './components/array/ArrayCell.svelte';
import type { ArrayCellExternalProps } from './components/typeDefinitions';
import type {
  CellColumnLike,
  CellComponentFactory,
  SimpleCellDataTypes,
} from './typeDefinitions';
import { getCellConfiguration, getCellInfo } from './utils';

export interface ArrayLikeColumn extends CellColumnLike {
  type_options: {
    item_type: DbType;
  } | null;
  display_options: Record<string, never> | null;
}

type ComponentFactoryMap = Record<SimpleCellDataTypes, CellComponentFactory>;

function makeDisplayFormatter(
  componentFactoryMap: ComponentFactoryMap,
  column: ArrayLikeColumn,
) {
  const itemDbType = column.type_options?.item_type ?? 'string';
  const cellInfo = getCellInfo(itemDbType);
  const config = getCellConfiguration(itemDbType, cellInfo);
  const elementDataType =
    !cellInfo || cellInfo.type === 'array' ? 'string' : cellInfo.type;
  const elementCellFactory = componentFactoryMap[elementDataType];
  return (cellValue: unknown) => {
    if (!isDefinedNonNullable(cellValue)) {
      return String(cellValue);
    }
    if (elementCellFactory.getDisplayFormatter) {
      return elementCellFactory.getDisplayFormatter(
        {
          type: itemDbType,
          type_options: null,
          display_options: column.display_options,
        },
        config,
      )(cellValue);
    }
    return String(cellValue);
  };
}

export default function arrayType(
  componentFactoryMap: ComponentFactoryMap,
): CellComponentFactory {
  return {
    get: (
      column: ArrayLikeColumn,
    ): ComponentAndProps<ArrayCellExternalProps> => ({
      component: ArrayCell,
      props: {
        formatElementForDisplay: makeDisplayFormatter(
          componentFactoryMap,
          column,
        ),
      },
    }),
    getInput: (): ComponentAndProps => ({ component: TextInput }),
    getDisplayFormatter: (column: ArrayLikeColumn) => {
      const formatOneValue = makeDisplayFormatter(componentFactoryMap, column);
      return (cellValue: unknown) => {
        if (Array.isArray(cellValue)) {
          return cellValue.map(formatOneValue).join(', ');
        }
        return formatOneValue(cellValue);
      };
    },
  };
}
