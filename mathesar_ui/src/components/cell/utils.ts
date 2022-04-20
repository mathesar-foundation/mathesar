import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types';
import type { CellComponentAndProps } from './data-types/components/typeDefinitions';
import DataTypes from './data-types';

function getCellConfiguration(
  column: Column,
): AbstractTypeConfiguration['cell'] | undefined {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.cell;
}

export function getCellComponentWithProps(
  column: Column,
): CellComponentAndProps<unknown> {
  const cellInfo = getCellConfiguration(column);
  const config = cellInfo?.config ?? {};
  const conditionalConfig = cellInfo?.conditionalConfig?.[column.type] ?? {};
  const combinedCellConfig = {
    ...config,
    ...conditionalConfig,
  };
  switch (cellInfo?.type) {
    case 'boolean':
      return DataTypes.boolean.get(column);
    case 'string':
      return DataTypes.string.get(column, combinedCellConfig);
    default:
      return DataTypes.string.get(column);
  }
}
