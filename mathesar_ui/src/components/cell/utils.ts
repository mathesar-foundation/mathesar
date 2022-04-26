import { get } from 'svelte/store';
import type { Column } from '@mathesar/stores/table-data/types';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types';
import type { ComponentAndProps } from '@mathesar-component-library/types';
import DataTypes from './data-types';

export type CellValueFormatter<T> = (
  value: T | null | undefined,
) => string | null | undefined;

function getCellInfo(
  column: Column,
): AbstractTypeConfiguration['cell'] | undefined {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.cell;
}

function getCellConfiguration(
  column: Column,
  cellInfo?: AbstractTypeConfiguration['cell'],
): Record<string, unknown> {
  const config = cellInfo?.config ?? {};
  const conditionalConfig = cellInfo?.conditionalConfig?.[column.type] ?? {};
  return {
    ...config,
    ...conditionalConfig,
  };
}

export function getCellComponentWithProps(
  column: Column,
): ComponentAndProps<unknown> {
  const cellInfo = getCellInfo(column);
  const config = getCellConfiguration(column, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].get(column, config);
}

export function getColumnBasedInputComponentWithProps(
  column: Column,
): ComponentAndProps<unknown> {
  const cellInfo = getCellInfo(column);
  const config = getCellConfiguration(column, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].getInput(column, config);
}
