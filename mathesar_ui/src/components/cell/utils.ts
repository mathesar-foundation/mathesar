import { get } from 'svelte/store';
import {
  currentDbAbstractTypes,
  getAbstractTypeForDbType,
} from '@mathesar/stores/abstract-types';
import type { AbstractTypeConfiguration } from '@mathesar/stores/abstract-types/types';
import type {
  ComponentAndProps,
  IconProps,
} from '@mathesar-component-library/types';
import DataTypes from './data-types';
import type { CellColumnLike } from './data-types/typeDefinitions';

export type CellValueFormatter<T> = (
  value: T | null | undefined,
) => string | null | undefined;

function getCellInfo(
  dbType: CellColumnLike['type'],
): AbstractTypeConfiguration['cell'] | undefined {
  const abstractTypeOfColumn = getAbstractTypeForDbType(
    dbType,
    get(currentDbAbstractTypes)?.data,
  );
  return abstractTypeOfColumn?.cell;
}

function getCellConfiguration(
  dbType: CellColumnLike['type'],
  cellInfo?: AbstractTypeConfiguration['cell'],
): Record<string, unknown> {
  const config = cellInfo?.config ?? {};
  const conditionalConfig = cellInfo?.conditionalConfig?.[dbType] ?? {};
  return {
    ...config,
    ...conditionalConfig,
  };
}

export function getCellCap(
  column: CellColumnLike,
  cellInfo: AbstractTypeConfiguration['cell'],
): ComponentAndProps<unknown> {
  const config = getCellConfiguration(column.type, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].get(column, config);
}

export function getDbTypeBasedInputCap(
  column: CellColumnLike,
  cellInfoConfig?: AbstractTypeConfiguration['cell'],
): ComponentAndProps<unknown> {
  const cellInfo = cellInfoConfig ?? getCellInfo(column.type);
  const config = getCellConfiguration(column.type, cellInfo);
  return DataTypes[cellInfo?.type ?? 'string'].getInput(column, config);
}

export function getColumnIconProps(column: CellColumnLike): IconProps {
  return getAbstractTypeForDbType(
    column.type,
    get(currentDbAbstractTypes)?.data,
  ).icon;
}
