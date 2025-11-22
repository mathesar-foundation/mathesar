import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import type { DbType } from '@mathesar/AppTypes';
import { getAbstractTypeForDbType } from '@mathesar/stores/abstract-types';
import type { CellInfo } from '@mathesar/stores/abstract-types/types';

export function getCellInfo(
  dbType: DbType,
  columnMetadata: ColumnMetadata | null,
): CellInfo | undefined {
  const abstractTypeOfColumn = getAbstractTypeForDbType(dbType, columnMetadata);
  return abstractTypeOfColumn?.cellInfo;
}

export function getCellConfiguration(
  dbType: DbType,
  cellInfo?: CellInfo,
): Record<string, unknown> {
  const config = cellInfo?.config ?? {};
  const conditionalConfig = cellInfo?.conditionalConfig?.[dbType] ?? {};
  return {
    ...config,
    ...conditionalConfig,
  };
}
